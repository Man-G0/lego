const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const mongo_logics = require('./mongo_logics');
const paginateInfo = require('paginate-info');

const PORT = 8092;

const app = express();

module.exports = app;

app.use(require('body-parser').json());
app.use(cors());
app.use(helmet());

app.options('*', cors());

function requestBase(request) {
  const page = parseInt(request.query.page) || 1; // Default to 1 if not provided
  var tempLimit = parseInt(request.query.limit) || 10; // Default to 10 if not provided
  

  const {limit, offset}= paginateInfo.calculateLimitAndOffset(page, tempLimit);
  const priceMin = parseFloat(request.query.priceMin);  
  const priceMax = parseFloat(request.query.priceMax);
  const startDate = parseInt(request.query.dateMin);
  const endDate = parseInt(request.query.dateMax);
  const sortBy = request.query.sortBy;
  return { page,limit, priceMin, priceMax, startDate, endDate, sortBy, offset };
}


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


  

// deals search globale des deals deallabs
app.get('/deals/search', async (request, response) => {
  try {
    // Récupérer les paramètres de la requête
    const { page,limit, priceMin, priceMax, startDate, endDate, sortBy, offset } = requestBase(request);
    const discountMin = parseInt(request.query.discountMin);
    const commentMin = parseInt(request.query.commentMin);
    
    const {deals, total} = await mongo_logics.findDeals(priceMin, priceMax, startDate, endDate, sortBy, limit, offset, discountMin, commentMin );
    
    response.json({
      success: true,
      pagination : paginateInfo.paginate(page, total, deals, limit),
      results: deals,  
      });
      
  } catch (err) {
    console.error('Error while searching for deals:', err);
    response.status(500).json({ error: 'Internal Server Error' });
  }
});





/* sales ___________________________________________________________________*/ 

app.get('/sales/search', async (request, response) => {
  try {
    const { page,limit, priceMin, priceMax, startDate, endDate, sortBy, pageLimit, offset } = requestBase(request);
    const legoSetId = request.query.legoSetId; // ID du set LEGO à rechercher
    const favouriteCount = parseInt(request.query.favouriteCount||0); // Nombre de favoris minimum
    let { sales, total } = await mongo_logics.findSales(legoSetId, priceMin, priceMax, startDate, endDate, sortBy,limit, offset, favouriteCount);
    response.json({
      success: true,
      pagination: paginateInfo.paginate(page, total,sales, limit),
      results: sales,
    });
  } catch (err) {
    console.error('Error while searching for sales:', err);
    response.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = app;
process.on('SIGINT', async () => {
  console.log('🛑 Gracefully shutting down');
  server.close(() => {
    console.log('🔌 Server closed');
    process.exit(0); // Quitte le programme proprement
  });
});


