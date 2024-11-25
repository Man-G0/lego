/* eslint-disable no-console, no-process-exit */
const fs = require('fs');

const deallabs = require('./websites/deallabs');
const puppeteer = require('puppeteer');
const vinted = require('./websites/vinted.js');


async function sandbox() {
  try {

    
    // Scraper les deals de Dealabs
    const dealabsUrl = 'https://www.dealabs.com/groupe/lego?hide_expired=true';
    const dealabsDeals = await deallabs.scrape(dealabsUrl);
    console.log(`${dealabsDeals.length} deals found on Dealabs.`);
    
    // Préparer Puppeteer pour scraper Vinted
    const browser = await puppeteer.launch({ headless: true });
    const combinedDeals = [];
    
    for (const deal of dealabsDeals) {   
      //const vintedUrl = `https://www.vinted.fr/catalog?search_text=${deal.ID}&time=1731934184&brand_ids[]=89162&page=1;`;
      // Scraper les résultats correspondants sur Vinted
      var vintedDeals = [];
      if (deal.ID&&deal.ID.length>0) {
        console.log(`Searching Vinted deals for: ${deal.ID}`);
        vintedDeals = await vinted.scrape(deal.ID, browser);

      } else {
        console.log(`No ID found for ${deal.title}`);
      }
     

      combinedDeals.push({
        dealabs: deal,
        vinted: vintedDeals
      });
      //console.log(JSON.stringify(combinedDeals, null, 2)); // Affiche bien la structure avant d'écrire dans le fichier

    }

    await browser.close();

    // Enregistrer les résultats dans un fichier JSON
    const outputPath = './combined_deals.json';
    fs.writeFileSync(outputPath, JSON.stringify(combinedDeals, null, 2), 'utf-8');
    console.log(`Deals saved to ${outputPath}`);

    console.log('Done');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}


sandbox();
