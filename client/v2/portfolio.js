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

let favoriteDealIds = [];

// instantiate the selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const spanLegoSetName = document.querySelector('#lego-set-name');
const selectSort = document.querySelector('#sort-select');
const sectionDeals = document.querySelector('#deals');
const spanNbDeals = document.querySelector('#nbDeals');
const sectionVintedSales = document.querySelector('#vinted-sales');
const buttonBestDiscount = document.querySelector('#best-discount-toggle')
const buttonMostCommented = document.querySelector('#most-commented-toggle');
const buttonHotDeals = document.querySelector('#hot-deals-toggle');
const buttonFavoriteDeals = document.querySelector('#favorites-toggle');
const spanP5 = document.querySelector('#p5-sale-price');
const spanP50 = document.querySelector('#p50-sale-price');
const spanP25 = document.querySelector('#p25-sale-price');
const average = document.querySelector('#average-price');


/**
 * Set global value
 * @param {Array} result - deals to display
 * @param {Object} meta - pagination meta info
 */


const setCurrentDeals = ({ results, pagination }) => {
  currentDeals = results;
  currentPagination = pagination;
};



const durationSince = (date) => {
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


/**
 * Fetch deals from api
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=12] - size of the page
 * @return {Object}
 */
const fetchDeals = async (page = 1, size = 12) => {
  try {
    const response = await fetch(
      `https://lego-sigma-seven.vercel.app/deals/search?page=${page}&size=${size}`
    );
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return { currentDeals, currentPagination };
    }
    console.log(body);
    return body;
  } catch (error) {
    console.error(error);
    return { currentDeals, currentPagination };
  }
};
/**
 * Fetch sales for a given lego set id
 */
const fetchSales = async id => {
  try {
    const response = await fetch(`https://lego-sigma-seven.vercel.app/sales/search?legoSetId=${id}`);
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return [];
    }

    return body;
  } catch (error) {
    console.error(error);
    return [];
  }
};
/**
 * Render list of deals
 * @param  {Array} deals
 */
const renderDeals = deals => {
  const dealsContainer = sectionDeals.querySelector('.deals-container');
  dealsContainer.innerHTML = ''; // Clear previous deals
  if (!deals.length) {
    dealsContainer.innerHTML = '<h2>No deals found</h2>';
    return;
  } else {
    const fragment = document.createDocumentFragment(); // Create a fragment for better performance

    deals.forEach(deal => {
      const dealDiv = document.createElement('div');
      const dealContent = deal.dealabs;
      dealDiv.classList.add('deal');
      dealDiv.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: space-between; ">
            <div style="width: 100%; display: flex; flex-direction: row;justify-content: space-between;">
            <img 
              src="${favoriteDealIds.includes(dealContent.ID) ? '../images/star.png' : '../images/empty-star.png'}" 
              class="favorite-icon" 
              deal-id="${dealContent.ID}" 
              alt="Add to favorites" 
              style="width: 13%; cursor: pointer; margin-bottom: 5%;"
            />
            <button class= "plus-button" style="width: 15%; cursor: pointer; font-size: small;" deal-id="${dealContent.ID}">+</button>
            </div>
          <img src="${dealContent.mainImage}" alt="${dealContent.title}" class="deal-image" style="width: 90%; max-width: 90%;" />
        </div>

        <div style="text-align: center; margin-top: 10px;flex-grow: 1;">
          <span>Set ID: ${dealContent.ID}</span><br />
          <a href="${dealContent.link}" target="_blank" style="display: block; margin-top: 5px;">${dealContent.title}</a>
          <span style="display: block; margin-top: 5px;">${dealContent.price} €</span>
          <span style="display: block; margin-top: 5px;">${dealContent.discount}% discount</span>
        </div>
      `;
      // Fetch the price indicators and update the comments span after the dealDiv is appended


      fragment.appendChild(dealDiv); // Append to fragment

    });

    dealsContainer.appendChild(fragment); // Append the entire fragment at once

    attachEventListeners(dealsContainer);
  }
};

const attachEventListeners = (dealsContainer) => {
  dealsContainer.querySelectorAll('.favorite-icon').forEach(icon => {
    icon.addEventListener('click', () => {
      const dealId = icon.getAttribute('deal-id');
      toggleFavorite(icon, dealId);
    });
  });
  dealsContainer.querySelectorAll('.plus-button').forEach(button => {
    button.addEventListener('click', () => {
      const dealId = button.getAttribute('deal-id');
      openVintedSalesPopup(dealId);
    });
  });
}

const toggleFavorite = (icon, dealId) => {
  if (icon.src.includes('empty-star.png')) {
    icon.src = '../images/star.png';
    console.log(`Deal ${dealId} added to favorites`);
    favoriteDealIds.push(dealId);
  } else {
    icon.src = '../images/empty-star.png';
    console.log(`Deal ${dealId} removed from favorites`);
    favoriteDealIds = favoriteDealIds.filter(id => id !== dealId);
  }
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
};
const calculatePriceIndicators = (sales) => {
  if (!sales) {
    return { numberOfSales: 0, oldestDuration: 0, average: 0, p5: 0, p25: 0, p50: 0 };
  } else {
    const numberOfSales = sales.length;
    const oldestLifetimeValue = sales.map(sale => sale.published).sort((a, b) => a - b)[0];
    const oldestDuration = durationSince(oldestLifetimeValue);
    const mostRecentOffer = durationSince(sales.map(sale => sale.published).sort((a, b) => b - a)[0]);
    const prices = sales.map(sale => parseFloat(sale.price)).sort((a, b) => a - b);
    const avg = (prices.reduce((sum, price) => sum + price, 0) / prices.length).toFixed(2);
    const p5 = prices[Math.floor(prices.length * 0.05)].toFixed(2);
    const p25 = prices[Math.floor(prices.length * 0.25)].toFixed(2);
    const p50 = prices[Math.floor(prices.length * 0.50)].toFixed(2);
    return { numberOfSales, mostRecentOffer, oldestDuration, avg, p5, p25, p50 };
  }


};


/**
 * Declaration of all Listeners
 */

/**
 * Select the number of deals to display
 */


document.addEventListener('DOMContentLoaded', async () => {
  const dealsApiCall = await fetchDeals();
  setCurrentDeals(dealsApiCall);
  console.log(currentDeals);
  render(currentDeals, currentPagination);
});

selectPage.addEventListener('change', async (event) => {
  const dealsApiCall= await fetchDeals(parseInt(event.target.value), selectShow.value);
  setCurrentDeals(dealsApiCall);
  render(currentDeals, currentPagination);
});

selectShow.addEventListener('change', async (event) => {
  const dealsApiCall = await fetchDeals(currentPagination.currentPage, parseInt(event.target.value));

  setCurrentDeals(dealsApiCall);
  render(currentDeals, currentPagination);
});


function sortDealsByDiscount(list) {
  let sortedDeals = list.sort((a, b) => b.discount - a.discount);
  return sortedDeals;
}
/**BUTTON LISTENERS */
function buttonChangeState(button) {
  if (button.state === 'off') {
    button.src = '../images/toggle-on.png';
    button.state = 'on';
  }
  else {
    button.src = '../images/toggle-off.png';
    button.state = 'off';
  }
}
/**
 * order by the discount desc and display only the deals with a discount >50
 */

buttonBestDiscount.addEventListener('click', async () => {
  const dealsApiCall = await fetchDeals(currentPagination.currentPage, selectShow.value);
  setCurrentDeals(dealsApiCall);
  buttonChangeState(buttonBestDiscount);
  if (buttonBestDiscount.state === 'on') {
    currentDeals = sortDealsByDiscount(currentDeals).filter(deal => deal.discount >= 50);
  }

  render(currentDeals, currentPagination);

});

buttonMostCommented.addEventListener('click', async () => {
  const dealsApiCall = await fetchDeals(currentPagination.currentPage, selectShow.value);
  setCurrentDeals(dealsApiCall);
  buttonChangeState(buttonMostCommented);
  if (buttonMostCommented.state === 'on') {
    currentDeals = currentDeals.filter(deal => deal.comments >= 15);;
  }
  console.log('Sorted by Most commented !');
  render(currentDeals, currentPagination);
})

buttonHotDeals.addEventListener('click', async () => {
  const dealsApiCall = await fetchDeals(currentPagination.currentPage, selectShow.value);
  setCurrentDeals(dealsApiCall);
  buttonChangeState(buttonHotDeals);
  if (buttonHotDeals.state === 'on') {
    currentDeals = currentDeals.filter(deal => deal.temperature >= 100);
  }
  console.log('Sorted by Hot deals !');
  render(currentDeals, currentPagination);
})


buttonFavoriteDeals.addEventListener('click', async () => {
  const dealsApiCall = await fetchDeals(currentPagination.currentPage, selectShow.value);
  setCurrentDeals(dealsApiCall);
  buttonChangeState(buttonFavoriteDeals);
  if (buttonFavoriteDeals.state === 'on') {
    currentDeals = currentDeals.filter(deal => favoriteDealIds.includes(deal.id));
  }
  console.log('Sorted by Favorite deals !')
  render(currentDeals, currentPagination);
})

selectSort.addEventListener('change', async (event) => {
  const dealsApiCall = await fetchDeals(currentPagination.currentPage, selectShow.value);
  setCurrentDeals(dealsApiCall);
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
  render(currentDeals, currentPagination);
});


/*for the popup*/

const vintedIndicators = async (legoSetId) => {
  const sales = await fetchSales(legoSetId);
  console.log(sales);
  return calculatePriceIndicators(sales.results);
}
const openVintedSalesPopup = async (legoSetId) => {
  const sales = await fetchSales(legoSetId);
  console.log(sales);

  const vintedSalesContent = document.getElementById('vinted-sales-content');
  vintedSalesContent.innerHTML = ''; // Clear previous content

  if (sales.length === 0) {
    vintedSalesContent.innerHTML = '<p>No Vinted sales found for this LEGO set.</p>';
  } else {
    const indicators = await calculatePriceIndicators(sales.results);


    const oldestDuration = indicators.oldestDuration;
    const mostRecentOffer = indicators.mostRecentOffer;

    const avg = indicators.avg;
    const p5 = indicators.p5;
    const p25 = indicators.p25;
    const p50 = indicators.p50;
    vintedSalesContent.innerHTML += `
          <div style="text-align: center; margin-top: 10px;">
            <H3>Vinted Sales</h3>
            <span>Number of sales: ${indicators.numberOfSales},</span>
            <span>Average: ${avg} €,</span>
            <span>P5: ${p5} €,</span>
            <span>P25: ${p25} €,</span>
            <span>P50: ${p50} €</span> <br />
            <span>Oldest offer: ${oldestDuration} ago</span>
            <span>Most recent offer: ${mostRecentOffer} ago</span><br /><br />
          </div>
        `;

    sales.results.forEach(sale => {
      vintedSalesContent.innerHTML += `
              <div class="sale">
                  <span>${formatageDate(sale.published)}</span>
                  <a href="${sale.link}" target="_blank">${sale.title}</a>
                  <span>${sale.price} €</span>
                  <span>${durationSince(sale.published)} ago</span>
              </div>
          `;
    });
  }

  document.getElementById('vinted-modal').style.display = 'block';
  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('vinted-modal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
  });

  document.getElementById('modal-overlay').addEventListener('click', () => {
    document.getElementById('vinted-modal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
  });
};




