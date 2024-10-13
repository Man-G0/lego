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

// current deals on the page
let currentDeals = [];
let currentPagination = {};

// instantiate the selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectLegoSetIds = document.querySelector('#lego-set-id-select');
const selectSort = document.querySelector('#sort-select');
const sectionDeals= document.querySelector('#deals');
const spanNbDeals = document.querySelector('#nbDeals');
const buttonBestDiscount = document.querySelector('#best-discount-button');
const buttonMostCommented = document.querySelector('#most-commented-button');
const buttonHotDeals = document.querySelector('#hot-deals-button');


/**
 * Set global value
 * @param {Array} result - deals to display
 * @param {Object} meta - pagination meta info
 */
const setCurrentDeals = ({result, meta}) => {
  currentDeals = result;
  currentPagination = meta;
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
      return {currentDeals, currentPagination};
    }

    return body.data;
  } catch (error) {
    console.error(error);
    return {currentDeals, currentPagination};
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
        <a href="${deal.link}">${deal.title}</a>
        <span>${deal.price}</span>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionDeals.innerHTML = '<h2>Deals</h2>';
  sectionDeals.appendChild(fragment);
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderPagination = pagination => {
  const {currentPage, pageCount} = pagination;
  const options = Array.from(
    {'length': pageCount},
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
  const {count} = pagination;

  spanNbDeals.innerHTML = count;
};

const render = (deals, pagination) => {
  renderDeals(deals);
  renderPagination(pagination);
  renderIndicators(pagination);
  renderLegoSetIds(deals)
};

/**
 * Declaration of all Listeners
 */
 
/**
 * Select the number of deals to display
 */
selectShow.addEventListener('change', async (event) => {
  const deals = await fetchDeals(currentPagination.currentPage, parseInt(event.target.value));

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

document.addEventListener('DOMContentLoaded', async () => {
  const deals = await fetchDeals();

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

selectPage.addEventListener('change', async (event) => {
  const deals = await fetchDeals(parseInt(event.target.value), selectShow.value);
  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

selectLegoSetIds.addEventListener('change', async (event) => {  
  const deals = await fetchDeals(currentPagination.currentPage, selectShow.value);
  setCurrentDeals(deals);
  const selectedId = event.target.value;
  if(selectedId!=''){
    currentDeals = currentDeals.filter(deal => deal.id === event.target.value);
  }
  render(currentDeals, currentPagination);
  selectLegoSetIds.value = selectedId;
});
function sortDealsByDiscount(list){
  let sortedDeals = list.sort((a,b)=>b.discount-a.discount);
  return sortedDeals;
}
/**
 * order by the discount desc and display only the deals with a discount >50
 */
buttonBestDiscount.addEventListener('click', async() => {
  const deals = await fetchDeals(currentPagination.currentPage, selectShow.value);
  setCurrentDeals(deals);
  console.log('Sorted by Best discount !!')
  currentDeals = sortDealsByDiscount(currentDeals).filter(deal => deal.discount>=50);
  console.table(currentDeals)
  render(currentDeals,currentPagination);
})

buttonMostCommented.addEventListener('click', async() => {
  const deals = await fetchDeals(currentPagination.currentPage, selectShow.value);
  setCurrentDeals(deals);
  currentDeals = currentDeals.filter(deal => deal.comments>=15);
  console.log('Sorted by Most commented !')
  console.table(currentDeals)
  render(currentDeals,currentPagination);
})

buttonHotDeals.addEventListener('click', async() => {
  const deals = await fetchDeals(currentPagination.currentPage, selectShow.value);
  setCurrentDeals(deals);
  currentDeals = currentDeals.filter(deal => deal.temperature>= 100);
  console.log('Sorted by Hot deals !')
  console.table(currentDeals)
  render(currentDeals,currentPagination);
})


selectSort.addEventListener('change', async (event) => {
  const deals = await fetchDeals(currentPagination.currentPage, selectShow.value);
  setCurrentDeals(deals);
  switch(event.target.value){
    case 'price-asc':
      currentDeals = currentDeals.sort((a,b)=>a.price-b.price);
      break;
    case 'price-desc':
      currentDeals = currentDeals.sort((a,b)=>b.price-a.price);
      break;
    case 'date-asc':
      currentDeals = currentDeals.sort((a,b)=>new Date(b.published)-new Date(a.published));
      break;
    case 'date-desc':
      currentDeals = currentDeals.sort((a,b)=>new Date(a.published)-new Date(b.published));
      break;
  }
  console.log(`Sorted by ${event.target.value}!`)
  console.table(currentDeals)
  render(currentDeals, currentPagination);
});


