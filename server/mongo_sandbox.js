require('dotenv').config(); 
const { MongoClient } = require('mongodb');
const MONGODB_URI = process.env.MONGODB_URI;  
const MONGODB_DB_NAME = 'lego';  

const deals = require('../combined_deals.json');  

async function sandbox_mongo() {
  try {
    const client = await MongoClient.connect(MONGODB_URI);

    const db = client.db(MONGODB_DB_NAME); 

    // Get the 'deals' collection
    const collection = db.collection('deals');
    
    // Insert many deals
    const result = await collection.insertMany(deals);
    console.log(`${result.insertedCount} deals inserted`);

    // Close the client after the operation
    client.close();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

//sandbox_mongo();
findBestDiscountDeals();

async function findBestDiscountDeals() {
  try {
    const db = client.db(MONGODB_DB_NAME);
    const collection = db.collection('deals');

    const deals = await collection.find({
      price: { $lt: 50 }  // Par exemple, on cherche des prix inférieurs à 50 EUR
    }).toArray();

    console.log("Best discount deals:", deals);
    return deals;
  } catch (e) {
    console.error('Error finding best discount deals:', e);
  }
}

async function findMostCommentedDeals() {
  try {
    const db = client.db(MONGODB_DB_NAME);
    const collection = db.collection('deals');

    const deals = await collection.find()
      .sort({ commentCount: -1 })  // Trier par le nombre de commentaires, décroissant
      .limit(10)  // Limite à 10 meilleurs résultats
      .toArray();

    console.log("Most commented deals:", deals);
    return deals;
  } catch (e) {
    console.error('Error finding most commented deals:', e);
  }
}

async function findDealsSortedByPrice() {
  try {
    const db = client.db(MONGODB_DB_NAME);
    const collection = db.collection('deals');

    const deals = await collection.find()
      .sort({ price: 1 })  // Trier par prix croissant
      .toArray();

    console.log("Deals sorted by price:", deals);
    return deals;
  } catch (e) {
    console.error('Error finding deals sorted by price:', e);
  }
}

async function findDealsSortedByDate() {
  try {
    const db = client.db(MONGODB_DB_NAME);
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

async function findRecentVintedSalesByDealId(dealId) {
  try {
    const db = client.db(MONGODB_DB_NAME);
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

async function findAndSortVintedSalesByDate(dealId) {
  try {
    const db = client.db(MONGODB_DB_NAME);
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


