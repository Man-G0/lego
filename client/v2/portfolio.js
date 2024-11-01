// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
'use strict';

/**
Description of the available api
GET https://lego-api-blue.vercel.app/deals

Search for specific deals

This endpoint accepts the following optional query string parameters:

- `page` - page of deals to return
- `size` - number of deals to return

GET https://lego-api-blue.vercel.app/sales

Search for current Vinted sales for a given lego set id

This endpoint accepts the following optional query string parameters:

- `id` - lego set id to return
*/
 // to store all deals
let allDeals = [];
// current deals on the page
let currentDeals = [];
let currentSales = [];
let currentPagination = {};

// instantiate the selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectLegoSetIds = document.querySelector('#lego-set-id-select');
const spanLegoSetName = document.querySelector('#lego-set-name');
const selectSort = document.querySelector('#sort-select');
const sectionDeals = document.querySelector('#deals');
const sectionVintedSales = document.querySelector('#vinted-sales');
const spanNbDeals = document.querySelector('#nbDeals');
const spanNbSales = document.querySelector('#nbSales');
const buttonBestDiscount = document.querySelector('#best-discount-button');
const buttonMostCommented = document.querySelector('#most-commented-button');
const buttonHotDeals = document.querySelector('#hot-deals-button');
const spanP5 = document.querySelector('#p5-sale-price');
const spanP50 = document.querySelector('#p50-sale-price');
const spanP25 = document.querySelector('#p25-sale-price');
const average = document.querySelector('#average-price');


/**
 * Set global value
 * @param {Array} result - deals to display
 * @param {Object} meta - pagination meta info
 */

const setAllDeals = ({ result, meta, sales }) => {
  allDeals = result.map(deal => ({
    ...deal,                
    favorite: false         
  }));
  currentDeals = allDeals;
  currentSales = sales;
  currentPagination = meta;
}
const setCurrentDeals = ({ result, meta, sales }) => {
  currentDeals = result.map(deal => ({
    ...deal,
    favorite: false
  }));
  currentSales = sales;
  currentPagination = meta;
};

/**
 * Fetch numbers of sales for a given lego set id
 */
const fetchSales = async id => {
  try {
    const response = await fetch(`https://lego-api-blue.vercel.app/sales?id=${id}`);
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return [];
    }

    return body.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const durationSince = (date) => {
  console.log(date);
  console.log(new Date());
  console.log(new Date(date * 1000));
  date = (new Date().getTime() - date * 1000) / 1000;
  const months = Math.floor(date / 60 / 60 / 24 / 30);
  const remainingDays = Math.floor(date / 60 / 60 / 24 % 30.4);
  const remainingHours = Math.floor(date / 60 / 60 % 24);
  const remainingMinutes = Math.floor(date / 60 % 60);

  const parts = [];
  if (months > 0) parts.push(`${months} months and`);
  if (remainingDays > 0) parts.push(`${remainingDays} days`);
  else {
    if (remainingHours > 0) parts.push(`${remainingHours} hours and`);
    if (remainingMinutes > 0) parts.push(`${remainingMinutes} minutes`);
  }
  return parts.join(' ');
};
const formatageDate = (date) => {
  date = new Date(date * 1000);
  return `${String(date.getDay()).padStart(2, '0')}/${String(date.getMonth()).padStart(2, '0')}/${date.getFullYear()}`;
}

const renderVintedSales = () => {
  if (!currentSales.length) {
    sectionVintedSales.innerHTML = '';
    sectionVintedSales.innerHTML = '<h2>Vinted Sales</h2><p>Please choose a specific set</p>';
    return;
  }
  else {
    const fragment = document.createDocumentFragment();
    const div = document.createElement('div');
    const oldestLifetimeValue = currentSales.map(sale => sale.published).sort((a, b) => a - b)[0];
    const oldestDuration = durationSince(oldestLifetimeValue);

    document.querySelector('#lifetime-value').innerHTML = oldestDuration;
    document.querySelector('#lifetime-value').append(' ago');

    document.querySelector('#recent-value').innerHTML = durationSince(currentSales.map(sale => sale.published).sort((a, b) => b - a)[0]);
    document.querySelector('#recent-value').append(' ago');

    const template = currentSales
      .map(sale => {
        return `
      <div class="sale" id=${sale.uuid}>
        <span>${formatageDate(sale.published)}</span>
        <a href="${sale.link}" target="_blank">${sale.title}</a>
        <span>${sale.price}</span>
        <span>${durationSince(sale.published)} ago </span>
      </div>
    `;
      })
      .join('');

    div.innerHTML = template;
    sectionVintedSales.innerHTML = '<h2>Vinted Sales</h2>';
    fragment.appendChild(div);
    sectionVintedSales.appendChild(fragment);
  }


};

/**
 * Fetch deals from api
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=12] - size of the page
 * @return {Object}
 */
const fetchDeals = async (page = 1, size = 6) => {
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}`
    );
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return { currentDeals, currentPagination };
    }

    return body.data;
  } catch (error) {
    console.error(error);
    return { currentDeals, currentPagination };
  }
};

/**
 * Render list of deals
 * @param  {Array} deals
 */
const renderDeals = deals => {
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  const template = deals
    .map(deal => {
      return `
      <div class="deal" id=${deal.uuid}>
        <span>${deal.id}</span>
        <a href="${deal.link}" target="_blank">${deal.title}</a>
        <span>${deal.price}</span>
        <img 
          src="${deal.favorite ? '../images/star.png' : '../images/empty-star.png'}" 
          class="favorite-icon" 
          data-id="${deal.uuid}" 
          alt="Add to favorites" 
          style="width: 20px; cursor: pointer;"
        />
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionDeals.innerHTML = '<h2>Deals</h2>';
  sectionDeals.appendChild(fragment);

  const favoriteIcons = div.querySelectorAll('.favorite-icon');
  favoriteIcons.forEach(icon => {
    icon.addEventListener('click', (event) => {
      const dealId = event.target.getAttribute('data-id');
      toggleFavorite(event.target, dealId);
    });
  });

  const toggleFavorite = (icon, dealId) => {
    if (icon.src.includes('empty-star.png')) {
      icon.src = '../images/star.png'; // Path to filled star
      console.log(`Deal ${dealId} added to favorites`);
      deals.find(deal => deal.uuid === dealId).favorite = true;
    } else {
      icon.src = '../images/empty-star.png'; // Path to empty star
      console.log(`Deal ${dealId} removed from favorites`);
      deals.find(deal => deal.uuid === dealId).favorite = false;
    }
  };
};



/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderPagination = pagination => {
  const { currentPage, pageCount } = pagination;
  const options = Array.from(
    { 'length': pageCount },
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join('');

  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
};

/**
 * Render lego set ids selector
 * @param  {Array} lego set ids
 */
const renderLegoSetIds = deals => {
  const ids = getIdsFromDeals(deals);
  const options = ['<option value="">All Sets</option>']
    .concat(ids.map(id => `<option value="${id}">${id}</option>`))
    .join('');
  selectLegoSetIds.innerHTML = options;
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderIndicators = pagination => {
  const { count } = pagination;

  spanNbDeals.innerHTML = count;
};

const render = (deals, pagination) => {
  renderDeals(deals);
  renderPagination(pagination);
  renderIndicators(pagination);
  renderLegoSetIds(deals)
};
const calculatePriceIndicators = () => {
  if (!currentSales.length) {
    return { average: 0, p5: 0, p25: 0, p50: 0 };
  } else {
    const prices = currentSales.map(sale => parseFloat(sale.price)).sort((a, b) => a - b);
    const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const p5 = prices[Math.floor(prices.length * 0.05)];
    const p25 = prices[Math.floor(prices.length * 0.25)];
    const p50 = prices[Math.floor(prices.length * 0.50)];
    return { avg, p5, p25, p50 };
  }


};


/**
 * Declaration of all Listeners
 */

/**
 * Select the number of deals to display
 */


document.addEventListener('DOMContentLoaded', async () => {
  const deals = await fetchDeals();
  const sales = await fetchSales();

  setAllDeals(deals);
  render(currentDeals, currentPagination);
});

selectPage.addEventListener('change', async (event) => {
  const deals = await fetchDeals(parseInt(event.target.value), selectShow.value);
  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

selectShow.addEventListener('change', async (event) => {
  const deals = await fetchDeals(currentPagination.currentPage, parseInt(event.target.value));

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

const displayPriceIndicators = ({ avg, p5, p25, p50 }) => {
  average.innerHTML = avg.toFixed(2);
  spanP5.innerHTML = p5.toFixed(2);
  spanP25.innerHTML = p25.toFixed(2);
  spanP50.innerHTML = p50.toFixed(2);

};

selectLegoSetIds.addEventListener('change', async (event) => {
  const deals = await fetchDeals(currentPagination.currentPage, selectShow.value);

  setCurrentDeals(deals);
  const selectedId = event.target.value;
  if (selectedId != '') {
    const sales = await fetchSales(event.target.value);
    spanLegoSetName.innerHTML = deals.result.find(deal => deal.id === event.target.value).title;
    currentSales = sales.result;
    const priceIndicators = calculatePriceIndicators(sales);
    displayPriceIndicators(priceIndicators);

    spanNbSales.innerHTML = sales.result.length;
    currentDeals = currentDeals.filter(deal => deal.id === event.target.value);
    renderVintedSales();
  }
  else {
    spanLegoSetName.innerHTML = '';
    spanNbSales.innerHTML = 0;
    currentSales = [];
    renderVintedSales();

    displayPriceIndicators({ avg: 0, p5: 0, p25: 0, p50: 0 });
  }

  render(currentDeals, currentPagination);
  selectLegoSetIds.value = selectedId;
});
function sortDealsByDiscount(list) {
  let sortedDeals = list.sort((a, b) => b.discount - a.discount);
  return sortedDeals;
}
/**
 * order by the discount desc and display only the deals with a discount >50
 */
buttonBestDiscount.addEventListener('click', async () => {
  console.log('Sorted by Best discount !!')
  currentDeals = allDeals.filter(deal => deal.discount >= 50);
  console.table(currentDeals)
  render(currentDeals, currentPagination);
})

buttonMostCommented.addEventListener('click', async () => {
  currentDeals = allDeals.filter(deal => deal.comments >= 15);
  console.log('Sorted by Most commented !')
  console.table(currentDeals)
  render(currentDeals, currentPagination);
})

buttonHotDeals.addEventListener('click', async () => {
  currentDeals = allDeals.filter(deal => deal.temperature >= 100);
  console.log('Sorted by Hot deals !')
  console.table(currentDeals)
  render(currentDeals, currentPagination);
})


selectSort.addEventListener('change', async (event) => {
  const deals = await fetchDeals(currentPagination.currentPage, selectShow.value);
  setCurrentDeals(deals);
  switch (event.target.value) {
    case 'price-asc':
      currentDeals = currentDeals.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      currentDeals = currentDeals.sort((a, b) => b.price - a.price);
      break;
    case 'date-asc':
      currentDeals = currentDeals.sort((a, b) => new Date(b.published) - new Date(a.published));
      break;
    case 'date-desc':
      currentDeals = currentDeals.sort((a, b) => new Date(a.published) - new Date(b.published));
      break;
  }
  console.log(`Sorted by ${event.target.value}!`)
  console.table(currentDeals)
  render(currentDeals, currentPagination);
});


