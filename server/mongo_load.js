require('dotenv').config(); 
const { MongoClient } = require('mongodb');
const MONGODB_URI = process.env.MONGODB_URI;  
const MONGODB_DB_NAME = 'lego';  

const deals = require('../combined_deals.json');  
const sales = require('../combined_vinted.json');
async function sandbox_mongo() {
  try {
    const client = await MongoClient.connect(MONGODB_URI);

    const db = client.db(MONGODB_DB_NAME);
    await db.collection('deals').drop();
    await db.collection('sales').drop();

    // Get the 'deals' collection
    const collection = db.collection('deals');
    const result = await collection.insertMany(deals);
    console.log(`${result.insertedCount} deals inserted`);

    const collection2 = db.collection('sales');
    const result2 = await collection2.insertMany(sales);
    console.log(`${result2.insertedCount} sales inserted`);

    // Close the client after the operation
    client.close();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

sandbox_mongo();



