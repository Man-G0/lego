/* eslint-disable no-console, no-process-exit */
const avenuedelabrique = require('./websites/avenuedelabrique');
const deallabs = require('./websites/deallabs');
const puppeteer = require('puppeteer');
const vinted = require('./websites/vinted.js');

async function sandbox (website) {
  try {
    console.log(`🕵️‍♀️  browsing ${website} website`);
    if (website.includes('deallabs')) {
      const url = 'https://www.dealabs.com/groupe/lego?hide_expired=true';
      const deals = await deallabs.scrape(url);
      console.log(deals);
    }
    else if (website.includes('vinted')) {
      const url ='https://www.vinted.fr/catalog?search_text=lego%20${ID}&time=1730733272&page=1;'
      const browser = await puppeteer.launch({ headless: false });
      const deals = await vinted.scrape(url, browser);
      console.log(deals);
      await browser.close();
    }
    console.log('done');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

const [,, eshop] = process.argv;

sandbox(eshop);
