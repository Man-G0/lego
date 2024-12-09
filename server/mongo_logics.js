require('dotenv').config(); 
const { MongoClient } = require('mongodb');
const MONGODB_URI = process.env.MONGODB_URI;  
const MONGODB_DB_NAME = 'lego';  


async function connectToDatabase() {
  try {
    let client = await MongoClient.connect(MONGODB_URI);

    let db = client.db(MONGODB_DB_NAME); 
    console.log('🗄️ Connected to MongoDB');
    return { db, client };

  } catch (e) {
    console.error('Error:', e);
  }
}

async function closeDatabaseConnection(client) {
  if (client) {
    await client.close();
    console.log('🛑 MongoDB connection closed');
    db = null;
    client = null;
  }
}



async function findBestPriceDeals(db, price = 50, context={}) {
  try {
    const collection = db.collection('deals');
    const deals = await collection.find({
      "dealabs.price": { $lt: price }  // Par exemple, on cherche des prix inférieurs à 50 EUR
    }).toArray();
    
    //console.log("Best discount deals:", deals);
    return deals;

  } catch (e) {
    console.error('Error finding best discount deals:', e);
  }
}

async function sortByPrice(db,sortType = 1, context={}) {
  try {
    const collection = db.collection('deals');

    const deals = await collection.find()
      .sort({ price: sortType })  // Trier par prix croissant par défaut
      .toArray();

    console.log("Deals sorted by price:", deals);
    return deals;
  } catch (e) {
    console.error('Error finding deals sorted by price:', e);
  }
}

function buildMostCommentedDealsQuery(commentCount = 12, context = {}) {
  try {
    let query = { "dealabs.commentCount": { $gt: commentCount } };
    return query;
  } catch (e) {
    console.error('Error constructing query for most commented deals:', e);
    return {};  
  }
}

async function sortByCommentCount(sortType = -1, context={}) {
  try {    
    const query = { "dealabs.commentCount": sortType } 
    return query;
  } catch (e) {
    console.error('Error sorting commented deals:', e);
  }
}



async function sortByDate(db, sortType = -1,context={}) {
  try {
    const collection = db.collection('deals');

    const deals = await collection.find()
      .sort({ publishedAt: sortType })  // Trier par date de publication, décroissant par défaut
      .toArray();

    console.log("Deals sorted by date:", deals);
    return deals;
  } catch (e) {
    console.error('Error finding deals sorted by date:', e);
  }
}

async function findRecentVintedSalesByDealId(db, dealId, recentDate = (Date.now() - (3 * 7 * 24 * 60 * 60 * 1000)), context={}) {
  try {
    const collection = db.collection('deals');

    const deal = await collection.findOne({ 'dealabs.ID': dealId });
    if (!deal) {
      console.log('Deal not found');
      return [];
    }

    const recentVintedOffers = deal.vinted.filter(offer => {
      return offer.created_at && offer.created_at > recentDate; // 3 semaines en millisecondes par défaut
    });

    console.log(`Recent Vinted offers for deal ${dealId}:`, recentVintedOffers);
    return recentVintedOffers;
  } catch (e) {
    console.error('Error finding recent Vinted sales for dealId:', e);
  }
}

async function findAndSortVintedSalesByDate(db, dealId, context={}) {
  try {
    const collection = db.collection('deals');

    const deal = await collection.findOne({ 'dealabs.ID': dealId });
    if (!deal) {
      console.log('Deal not found');
      return [];
    }
    if (!deal.vinted || deal.vinted.length === 0) {
      console.log('No Vinted sales found for this deal');
      return [];
    }

    const sortedVintedSales = deal.vinted.sort((a, b) => {
      const dateA = a.created_at || 0; 
      const dateB = b.created_at || 0;
      return dateB - dateA; 
    });

    console.log(`Sorted Vinted sales for deal ${dealId}:`, sortedVintedSales);
    return sortedVintedSales;
  } catch (e) {
    console.error('Error sorting Vinted sales by date:', e);
  }
}

module.exports = {
  connectToDatabase,
  closeDatabaseConnection,
  findBestPriceDeals,
  buildMostCommentedDealsQuery,
  sortByPrice,
  sortByDate,
  findRecentVintedSalesByDealId,
  findAndSortVintedSalesByDate,
};
