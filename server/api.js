const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const { connectToDatabase, closeDatabaseConnection, findBestPriceDeals, sortByPrice, sortByDate, findRecentVintedSalesByDealId, findAndSortVintedSalesByDate } = require('./mongo_logics');
const mongo_logics = require('./mongo_logics');


const PORT = 8092;

const app = express();

module.exports = app;

app.use(require('body-parser').json());
app.use(cors());
app.use(helmet());

app.options('*', cors());

// accueil api
app.get('/', async (request, response) => {
  response.send({ message: 'Lego Deals is working, welcome from the API' });
});

// deal par ID de lego (a changer pour que ca soit bien un id unique parce qu'ici le find one ca trouvera le premier deal qui a un lego avec cet id)
app.get('/deal/:id', async (req, res) => {
  try {
    const dealId = req.params.id;

    if (!dealId) {
      return res.status(400).json({ success: false, message: "Deal ID is required." });
    }
    //const deal = await getDealById(dealId);
    const { db, client } = await mongo_logics.connectToDatabase();

    const collection = db.collection('deals');
    const deal = await collection.findOne({ 'dealabs.ID': dealId });
    await mongo_logics.closeDatabaseConnection(client);

    if (!deal) {
      return res.status(404).json({ success: false, message: "Deal not found." });
    }

    res.json({ success: true, data: deal });
  } catch (err) {
    console.error('Error in /deals/:id:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

app.get('/deals', async (req, res) => {
  try {
    const { db, client } = await mongo_logics.connectToDatabase();

    const collection = db.collection('deals');
    const deals = await collection.find().toArray();
    await mongo_logics.closeDatabaseConnection(client);

    res.json({ success: true, data: deals });
  } catch (err) {
    console.error('Error in /deals:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});



// deals search globale des deals deallabs, a voir pour les tris comment faire 
app.get('/deals/search', async (request, response) => {
  try {
    // Récupérer les paramètres de la requête
    const limit = parseInt(request.query.limit) || 12;
    const priceMin = parseFloat(request.query.priceMin);  
    const priceMax = parseFloat(request.query.priceMax);
    const startDate = parseInt(request.query.startDate) ;  
    const endDate = parseInt(request.query.endDate); 
    const discountMin = parseInt(request.query.discountMin);
    const commentMin = parseInt(request.query.commentMin);
    const sortBy = request.query.sortBy;  // sort by comments number, price, date...*/

    const { db, client } = await mongo_logics.connectToDatabase();
    
    let query = {}; 

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
    const deals = await db.collection('deals').find(query)
      .limit(limit)  // Limiter le nombre de résultats retournés
      .sort(sort)  // Trier par prix croissant
      .toArray();

    const total = await db.collection('deals').countDocuments(query); // Compter le nombre total de documents correspondant au filtre

    await mongo_logics.closeDatabaseConnection(client);

    response.json({
      limit,
      total,
      results: deals  // Directly return the result from MongoDB
    });
  } catch (err) {
    console.error('Error while searching for deals:', err);
    response.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/sales/search', async (request, response) => {
  try {
    const limit = parseInt(request.query.limit) || 12;
    const legoSetId = request.query.legoSetId; // ID du set LEGO à rechercher
    const priceMin = parseFloat(request.query.priceMin);  
    const priceMax = parseFloat(request.query.priceMax);
    const favouriteCount = parseInt(request.query.favouriteCount);
    const dateMin = parseInt(request.query.dateMin);
    const dateMax = parseInt(request.query.dateMax);
    const sortBy = request.query.sortBy; // Critère de tri (prix, favoris, etc.)
    const { db, client } = await mongo_logics.connectToDatabase();
    
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
    if (dateMin && dateMax) {
      query['timestamp'] = { $gte: dateMin, $lte: dateMax };
    } else if (dateMin) { 
      query['timestamp'] = { $gte: dateMin };
    } else if (dateMax) {
      query['timestamp'] = { $lte: dateMax };
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
    const sales = await db.collection('sales').find(query)
      .limit(limit)
      .sort(sort)
      .toArray();

    const total = await db.collection('sales').countDocuments(query); // Total des résultats

    await mongo_logics.closeDatabaseConnection(client);

    // Répondre avec les résultats
    response.json({
      limit,
      total,
      results: sales
    });
  } catch (err) {
    console.error('Error while searching for sales:', err);
    response.status(500).json({ error: 'Internal Server Error' });
  }
});



const server = app.listen(PORT);
console.log(`📡 Running on port ${PORT}`);

process.on('SIGINT', async () => {
  console.log('🛑 Gracefully shutting down');
  server.close(() => {
    console.log('🔌 Server closed');
    process.exit(0); // Quitte le programme proprement
  });
});


