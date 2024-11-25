require('dotenv').config(); 
const { MongoClient } = require('mongodb');
const MONGODB_URI = process.env.MONGODB_URI;  
const MONGODB_DB_NAME = 'lego';  


async function mongo_logics() {
  try {
    const client = await MongoClient.connect(MONGODB_URI);

    const db = client.db(MONGODB_DB_NAME); 

    //const deals = await findBestDiscountDeals(db);
    await findMostCommentedDeals(db);
    //console.log("Best discount deals:", deals);
    // Close the client after the operation
    client.close();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}



async function findBestPriceDeals(db, price = 50, context={}) {
  try {
    const collection = db.collection('deals');

    const deals = await collection.find({
      "dealabs.price": { $lt: price }  // Par exemple, on cherche des prix inférieurs à 50 EUR
    }).toArray();
    
    console.log("Best discount deals:", deals);
    return deals;

  } catch (e) {
    console.error('Error finding best discount deals:', e);
  }
}

async function findMostCommentedDeals(db, commentCount = 10, context={}) {
  try {
    const collection = db.collection('deals');

    const deals = await collection
      .find({"dealabs.commentCount": { $gt: commentCount }})
      .toArray();

    console.log("Most commented deals:", deals);
    return deals;
  } catch (e) {
    console.error('Error finding most commented deals:', e);
  }
}

async function sortByCommentCount(db,sortType = -1, context={}) {
  try {
    const collection = db.collection('deals');
    
    const deals = await collection
      .sort({ "dealabs.commentCount": sortType })  // Trier par le nombre de commentaires décroissant par défaut
      .toArray();

    console.log("sorted by number of comments :", deals);
    return deals;
  } catch (e) {
    console.error('Error sorting commented deals:', e);
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

async function findDealsSortedByDate(db) {
  try {
    const collection = db.collection('deals');

    const deals = await collection.find()
      .sort({ publishedAt: -1 })  // Trier par date de publication, décroissant
      .toArray();

    console.log("Deals sorted by date:", deals);
    return deals;
  } catch (e) {
    console.error('Error finding deals sorted by date:', e);
  }
}

async function findRecentVintedSalesByDealId(db, dealId) {
  try {
    const collection = db.collection('deals');

    const threeWeeksAgo = Date.now() - (3 * 7 * 24 * 60 * 60 * 1000); // 3 semaines en millisecondes

    const deal = await collection.findOne({ 'dealabs.ID': dealId });
    if (!deal) {
      console.log('Deal not found');
      return [];
    }

    const recentVintedOffers = deal.vinted.filter(offer => {
      return offer.created_at && offer.created_at > threeWeeksAgo;
    });

    console.log(`Recent Vinted offers for deal ${dealId}:`, recentVintedOffers);
    return recentVintedOffers;
  } catch (e) {
    console.error('Error finding recent Vinted sales for dealId:', e);
  }
}

async function findAndSortVintedSalesByDate(db, dealId) {
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


mongo_logics();