const cheerio = require('cheerio');

/**
 * Parse webpage data response
 * @param  {String} data - HTML response
 * @return {Array} deals - Array of deal objects
 */
const parse = data => {
  const $ = cheerio.load(data, { xmlMode: true });

  return $('div.prods a')
    .map((i, element) => {
      const price = parseFloat(
        $(element)
          .find('span.prodl-prix span')
          .text()
      );

      const discount = Math.abs(parseInt(
        $(element)
          .find('span.prodl-reduc')
          .text()
      ));

      return {
        discount,
        price,
        title: $(element).attr('title'),
      };
    })
    .get();
};

/**
 * Scrape a given URL page
 * @param {String} url - URL to parse
 * @returns {Array|null} Array of deals or null on error
 */
module.exports.scrape = async url => {
  // Dynamically import 'node-fetch' within the function
  const fetch = (await import('node-fetch')).default;

  try {
    const response = await fetch(url);

    if (response.ok) {
      const body = await response.text();
      return parse(body);
    } else {
      console.error(`Error: Received status ${response.status} from ${url}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    return null;
  }
};
