/* eslint-disable no-console, no-process-exit */
const fs = require('fs');
const avenuedelabrique = require('./websites/avenuedelabrique');
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
      console.log(`Searching Vinted deals for: ${deal.title}`);
      
      const vintedUrl = `https://www.vinted.fr/catalog?search_text=lego%20${deal.ID}&time=1730733272&page=1;`;

      // Scraper les résultats correspondants sur Vinted
      const vintedDeals = await vinted.scrape(vintedUrl, browser,);

      combinedDeals.push({
        dealabs: deal,
        vinted: vintedDeals
      });
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
