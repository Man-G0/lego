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
    client = null;
  }
}

async function findDeals(priceMin, priceMax, startDate, endDate, sortBy, limit, offset, discountMin, commentMin ) {
  try {
    let query = {}; // Initialisation du filtre
    const { db, client } = await connectToDatabase();

    /* FILTERs */

    if (priceMin && priceMax) {
      query['dealabs.price'] = { $lt: priceMax, $gt: priceMin }; 
    } else if (priceMin) {
      query['dealabs.price'] = { $gt: priceMin };
    } else if (priceMax) {
      query['dealabs.price'] = { $lt: priceMax };
    }

    if (startDate && endDate) {
      query['dealabs.publishedAt'] = { $gte: startDate, $lt: endDate };
    }
    else if (startDate) {
      query['dealabs.publishedAt'] = { $gte: startDate };
    }
    else if (endDate) {
      query['dealabs.publishedAt'] = { $lt: endDate };
    }

    if (discountMin) { 
      query['$expr'] = {
        $lt: [
          '$dealabs.price',  
          { 
            $multiply: [
              '$dealabs.nextBestPrice',  
              {$subtract: [1, { $divide: [discountMin, 100] }] }
            ]
          }
        ]
      };
    }
    

    if (commentMin) {
      query['dealabs.commentCount'] = { $gte: commentMin };
    }
    
    /* sort by */
    let sort = { 'dealabs.price': 1 };
    if (sortBy) {
      switch (sortBy) {
        case 'priceUp':
          sort = { 'dealabs.price': 1 };
          break;
        case 'priceDown':
          sort = { 'dealabs.price': -1 };
          break;
        case 'commentsUp':
          sort = { 'dealabs.commentCount': 1 };
          break;
        case 'commentsDown':
          sort = { 'dealabs.commentCount': -1 };
          break;
        case 'dateUp':
          sort = { 'dealabs.publishedAt': 1 };
          break;
        case 'dateDown':
          sort = { 'dealabs.publishedAt': -1 };
          break;
        default:
          sort = { 'dealabs.price': 1 };
          break;
      }
    }
    
    // Rechercher dans la collection "deals"
    const deals = await db.collection('deals').find(query).skip(offset).limit(limit).sort(sort).toArray();

    const total = await db.collection('deals').countDocuments(query); // Compter le nombre total de documents correspondant au filtre

    await closeDatabaseConnection(client);

    return { deals, total };

  } catch (e) {
    console.error('Error finding deals:', e);
  }
}

async function findSales(legoSetId, priceMin, priceMax, startDate, endDate, sortBy, limit,offset, favouriteCount) {
  try {
    const { db, client } = await connectToDatabase();
    
    let query = {}; // Initialisation du filtre
    let sort = {};  // Initialisation du tri

    // Filtre : ID du set LEGO
    if (legoSetId) {
      query['id_lego'] = legoSetId;
    }

    // Filtre : Plage de prix
    if (priceMin && priceMax) {
      query['price'] = { $gte: priceMin, $lte: priceMax };
    } else if (priceMin) {
      query['price'] = { $gte: priceMin };
    } else if (priceMax) {
      query['price'] = { $lte: priceMax };
    }
    if (startDate && endDate) {
      query['timestamp'] = { $gte: startDate, $lte: endDate };
    } else if (startDate) { 
      query['timestamp'] = { $gte: startDate };
    } else if (endDate) {
      query['timestamp'] = { $lte: endDate };
    }

    // Filtre : Nombre minimum de favoris
    if (favouriteCount) {
      query['favourite_count'] = { $gte: favouriteCount };
    }

    // Tri : Configurer le critère de tri
    if (sortBy) {
      switch (sortBy) {
        case 'priceUp':
          sort['price'] = 1; // Tri par prix croissant
          break;
        case 'priceDown':
          sort['price'] = -1; // Tri par prix décroissant
          break;
        case 'favouritesUp':
          sort['favourite_count'] = 1; // Tri par favoris croissant
          break;
        case 'favouritesDown':
          sort['favourite_count'] = -1; // Tri par favoris décroissant
          break;
        default:
          sort['timestamp'] = -1; // Tri par date décroissante par défaut
      }
    }

    // Exécuter la requête MongoDB
    const sales = await db.collection('sales').find(query).skip(offset).limit(limit).sort(sort).toArray();

    const total = await db.collection('sales').countDocuments(query); // Total des résultats

    await closeDatabaseConnection(client);

    return { sales, total };
  } catch (e) {
    console.error('Error finding sales:', e);
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
  findDeals,
  findSales
};
