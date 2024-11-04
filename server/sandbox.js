/* eslint-disable no-console, no-process-exit */
const avenuedelabrique = require('./websites/avenuedelabrique');
const deallabs = require('./websites/deallabs');

async function sandbox (website) {
  try {
    console.log(`🕵️‍♀️  browsing ${website} website`);

    const deals = await deallabs.scrape(website);

    console.log(deals);
    console.log('done');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

const [,, eshop] = process.argv;

sandbox(eshop);
