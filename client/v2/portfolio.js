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

let currentParameters = { priceMin: -1, priceMax: -1, startDate: 1724875869, endDate: Date.now * 1000, sort: 'temperatureDown', };

let favoriteDealIds = [];

// instantiate the selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const spanLegoSetName = document.querySelector('#lego-set-name');
const selectSort = document.querySelector('#sort-select');
const sectionDeals = document.querySelector('#deals');
const spanNbDeals = document.querySelector('#nbDeals');
const sectionVintedSales = document.querySelector('#vinted-sales');
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


let setCurrentDeals = ({ results, pagination }) => {
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
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}



/**
 * Fetch deals from api
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=12] - size of the page
 * @return {Object}
 */
const fetchDeals = async (page = 1, size = 12) => {
  try {
    let url = `https://lego-sigma-seven.vercel.app/deals/search?page=${page}&size=${size}`;

    if (currentParameters.priceMin >= 0) {
      url += `&priceMin=${currentParameters.priceMin}`;
    }
    if (currentParameters.priceMax >= 0) {
      url += `&priceMax=${currentParameters.priceMax}`;
    }
    if (currentParameters.startDate > 0 && currentParameters.endDate > 0 && currentParameters.startDate < currentParameters.endDate) {
      url += `&dateMin=${currentParameters.startDate}&dateMax=${currentParameters.endDate}`;
    } else if (currentParameters.startDate > 0) {
      url += `&dateMin=${currentParameters.startDate}`;
    } else if (currentParameters.endDate > 0) {

      url += `&dateMax=${currentParameters.endDate}`;
    }

    if (currentParameters.sort !== '') {
      url += `&sortBy=${currentParameters.sort}`;
    }

    const response = await fetch(url);
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return { currentDeals: [], currentPagination: {} };
    }

    return body;

  } catch (error) {
    console.error(error);
    return { currentDeals: [], currentPagination: {} };
  }
};

/**
 * Fetch sales for a given lego set id
 */
const fetchSales = async (id, pagination = 1, limit = 5, sortBy = "DateDown") => {
  try {
    const response = await fetch(`https://lego-sigma-seven.vercel.app/sales/search?legoSetId=${id}&page=${pagination}&size=${limit}&sortBy=${sortBy}`);
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
const renderDeals = async deals => {
  const dealsContainer = sectionDeals.querySelector('.deals-container');
  dealsContainer.innerHTML = ''; // Clear previous deals
  if (!deals.length) {
    dealsContainer.innerHTML = '<h2>No deals found</h2>';
    return;
  } else {
    const fragment = document.createDocumentFragment();
    const dealsWithSales = await Promise.all(deals.map(async (deal) => {
      let vintedsales = await fetchSales(deal.dealabs.ID, 1, 100);
      return { deal, vintedsales };
    }));

    dealsWithSales.forEach(({ deal, vintedsales }) => {
      let dealDiv = document.createElement('div');
      let rentabilite = 0;

      let dealContent = deal.dealabs;
      if (vintedsales.results.length > 0) {
        let vintedIndicators = calculatePriceIndicators(vintedsales);
        rentabilite = dealContent.price != 0 ? calculateRentability(deal, vintedIndicators) : 0;
      }
      let discount = dealContent.nextBestPrice != 0 ? (100 - (dealContent.price / dealContent.nextBestPrice * 100)).toFixed(0) : 0;
      let rentabilityClass = getBadgeClass(rentabilite, 20, rentabilityLevel);
      let temperatureClass = getBadgeClass(dealContent.temperature, 50.0, 100.0);


      let discountClass = discount > 0 ? getBadgeClass(discount, 20, 30) : '';

      dealDiv.classList.add('deal');
      dealDiv.innerHTML = `
        <div class="top-bar-deals-info">
        ${rentabilityClass == "high"
          ? `<img src="../images/hot-icon.gif" alt="hot-icon" style="margin-left: 1vw;width: 3vw;aspect-ratio: 1;  object-fit: contain;"/>`
          : ''
        }
        
        <h3 class="deal-title">
          <a href="${deal.dealabs.link}" target="_blank">${deal.dealabs.title}</a>
        </h3>
          <img 
            src="${favoriteDealIds.some(fav => fav.dealId === deal.dealabs.ID && parseFloat(fav.dealPrice) === parseFloat(deal.dealabs.price))
          ? '../images/star.png'
          : '../images/empty-star.png'
        }" 
            class="favorite-icon" 
            deal-id="${deal.dealabs.ID}"
            deal-price="${deal.dealabs.price}"
            alt="Add to favorites"
          />
          <button class="plus-button" deal-id="${deal.dealabs.ID}" deal-price="${deal.dealabs.price}">+</button>
        </div>
        <div div class="deal-image-container">
        
          <img src="${deal.dealabs.mainImage}" alt="${deal.dealabs.title}" class="deal-image" />
          <div class="badge-container">
            ${discount > 0
          ? `<div class="badge ${discountClass}">-${discount}%</div>`
          : ''
        }
            <div class="badge ${temperatureClass}" style="font-size: clamp(0.5rem, 0.8vw, 1.2rem);">
            ${deal.dealabs.temperature}°C
            </div>
          </div>
          <div class="deal-informations-container" >
            <div class="deal-informations" >
              ${formatageDate(deal.dealabs.publishedAt)}
            </div>
            <div class="deal-informations">
              ${deal.dealabs.price} €
              ${deal.dealabs.nextBestPrice != 0
          ? `<span id="real-price" style="color: #b3000c; text-decoration: line-through; font-size: clamp(0.5rem, 1vw, 1.8rem); font-weight: bold;">${deal.dealabs.nextBestPrice}€</span>`
          : ''
        }
            </div>

          </div>
          
          
        </div>
      `;


      fragment.appendChild(dealDiv);

    });

    dealsContainer.appendChild(fragment);

    attachEventListeners(dealsContainer);
  }
};
function getBadgeClass(temperature, lowValue, highValue) {
  if (temperature < lowValue) return 'low';
  if (temperature < highValue) return 'medium';
  return 'high';
}
let rentabilityLevel = 30;
function calculateRentability(deal, vintedIndicators) {
  const timeAdjustment = Math.min(1, deal.dealabs.publishedAt / ((vintedIndicators.oldestLifetimeValue + vintedIndicators.timeSinceMostRecentOffer) / 2));
  const avgMargin = vintedIndicators.avg - deal.dealabs.price;
  const maxMargin = vintedIndicators.p75 - deal.dealabs.price;
  const adjustedMargin = avgMargin + maxMargin / (2 * (1 + vintedIndicators.stdDev));
  const rentability = adjustedMargin * timeAdjustment;
  //|| vintedIndicators.p50 < 20 / 100 * vintedIndicators.p75

  if (isNaN(rentability)) {
    return 0;
  }
  else {
    return rentability;
  }
}


const attachEventListeners = (dealsContainer) => {
  dealsContainer.querySelectorAll('.favorite-icon').forEach(icon => {
    icon.addEventListener('click', (event) => {
      const dealId = icon.getAttribute('deal-id');
      const dealPrice = icon.getAttribute('deal-price');
      toggleFavorite(icon, dealId, dealPrice);
      event.stopPropagation();
    });
  });
  dealsContainer.querySelectorAll('.plus-button').forEach(button => {
    button.addEventListener('click', (event) => {
      const dealId = button.getAttribute('deal-id');
      const dealPrice = button.getAttribute('deal-price');
      openVintedSalesPopup(dealId, dealPrice);
      event.stopPropagation();
    });
  });
  dealsContainer.querySelectorAll('.deal-title a').forEach(link => {
    link.addEventListener('click', (event) => {
      event.stopPropagation();
    });
  });
  dealsContainer.querySelectorAll('.deal').forEach(deal => {
    deal.addEventListener('click', () => {
      const dealId = deal.querySelector('.plus-button').getAttribute('deal-id');
      const dealPrice = deal.querySelector('.plus-button').getAttribute('deal-price');
      openVintedSalesPopup(dealId, dealPrice);
    });
  });
}

const toggleFavorite = (icon, dealId, dealPrice) => {
  if (icon.src.includes('empty-star.png')) {
    icon.src = '../images/star.png';
    console.log(`Deal ${dealId} with price ${dealPrice} added to favorites`);
    favoriteDealIds.push({ dealId, dealPrice });
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

const render = (currentDeals, pagination) => {
  renderDeals(currentDeals);
  renderPagination(pagination);
  renderIndicators(pagination);
};

// Fonction de gestion des sliders
function initializeSliders(currentDeals) {
  const sliders = document.querySelectorAll(".slider-container");
  const nameDate = "Date:";
  const namePrice = "Price:";




  sliders.forEach(sliderContainer => {
    let sliderName = sliderContainer.querySelector("#name").textContent;
    let sliderOne = sliderContainer.querySelector("#slider-1");
    let sliderTwo = sliderContainer.querySelector("#slider-2");
    let displayValOne = sliderContainer.querySelector("#range1");
    let displayValTwo = sliderContainer.querySelector("#range2");
    let minGap = sliderName === nameDate ? 86400 : 1; // 1 jour en secondes

    let sliderTrack = sliderContainer.querySelector(".slider-track");


    if (sliderName === nameDate) {
      const epochTime = Math.floor(Date.now() / 1000); // en secondes
      sliderOne.max = epochTime;
      sliderTwo.max = epochTime;
      sliderTwo.value = epochTime;
      const sixMonthsAgo = epochTime - (3 * 30 * 24 * 60 * 60);
      sliderOne.min = sixMonthsAgo;
      sliderTwo.min = sixMonthsAgo;
      sliderOne.value = sixMonthsAgo;
      displayValOne.textContent = formatageDate(sliderOne.value);
      displayValTwo.textContent = formatageDate(sliderTwo.value);
    }
    else if (sliderName === namePrice) {

      sliderOne.value = 0;
      sliderTwo.value = sliderOne.max;
    }
    let sliderMinValue = sliderOne.min;
    let sliderMaxValue = sliderOne.max;


    // Fonction qui gère le premier slider
    let debounceTimeoutOne;
    async function slideOne() {
      clearTimeout(debounceTimeoutOne);
      debounceTimeoutOne = setTimeout(async () => {
        var value1 = parseInt(sliderOne.value);
        var value2 = parseInt(sliderTwo.value);
        if (value2 - value1 <= minGap) {
          sliderOne.value = value2 - minGap;
        }
        if (sliderName === nameDate) {
          currentParameters.startDate = value1;
          displayValOne.textContent = formatageDate(sliderOne.value);
        } else if (sliderName === namePrice) {
          currentParameters.priceMin = value1;
          displayValOne.textContent = sliderOne.value;
        }
        fillColor();
        const dealsApiCall = await fetchDeals();
        setCurrentDeals(dealsApiCall);
        currentPagination = dealsApiCall.pagination;
        currentDeals = dealsApiCall.results;
        render(currentDeals, currentPagination)
      }, 300);
      ;
    }

    // Fonction qui gère le deuxième slider
    let debounceTimeoutTwo;

    async function slideTwo() {
      clearTimeout(debounceTimeoutTwo);

      debounceTimeoutTwo = setTimeout(async () => {
        var value1 = parseInt(sliderOne.value);
        var value2 = parseInt(sliderTwo.value);

        if (value2 - value1 <= minGap) {
          sliderTwo.value = value1 + minGap;
        }

        if (sliderName === nameDate) {
          currentParameters.endDate = value2;
          displayValTwo.textContent = formatageDate(sliderTwo.value);
        } else if (sliderName === namePrice) {
          currentParameters.priceMax = value2;
          displayValTwo.textContent = sliderTwo.value;
        }

        fillColor();

        const dealsApiCall = await fetchDeals();
        setCurrentDeals(dealsApiCall.results);
        currentPagination = dealsApiCall.pagination;
        currentDeals = dealsApiCall.results;
        render(currentDeals, currentPagination);
      }, 300);
    }


    // Fonction de remplissage de la couleur
    function fillColor() {
      let percent1 = ((sliderOne.value - sliderMinValue) / (sliderMaxValue - sliderMinValue)) * 100;
      let percent2 = ((sliderTwo.value - sliderMinValue) / (sliderMaxValue - sliderMinValue)) * 100;
      sliderTrack.style.background = `linear-gradient(to right, #dadae5 ${percent1}% , #3264fe ${percent1}% , #3264fe ${percent2}%, #dadae5 ${percent2}%)`;
    }
    sliderOne.addEventListener("input", slideOne);
    sliderTwo.addEventListener("input", slideTwo);
  });
}




/**
 * Declaration of all Listeners
 */

/**
 * Select the number of deals to display
 */


document.addEventListener('DOMContentLoaded', async () => {
  const dealsApiCall = await fetchDeals();
  buttonFavoriteDeals.state = 'off';
  buttonHotDeals.state = 'off';

  setCurrentDeals(dealsApiCall);
  initializeSliders(currentDeals);
  selectShow.value = '12';
  render(currentDeals, currentPagination);
});

selectPage.addEventListener('change', async (event) => {
  const dealsApiCall = await fetchDeals(parseInt(event.target.value), selectShow.value);
  setCurrentDeals(dealsApiCall);
  render(currentDeals, currentPagination);
});

selectShow.addEventListener('change', async (event) => {
  const dealsApiCall = await fetchDeals(currentPagination.currentPage, parseInt(event.target.value));
  setCurrentDeals(dealsApiCall);
  render(currentDeals, currentPagination);
});



/**BUTTON LISTENERS */

document.querySelectorAll('.page-navigation button').forEach(button => {
  button.addEventListener('click', async (event) => {
    const page = parseInt(selectPage.value) + parseInt(button.value);
    const dealsApiCall = await fetchDeals(page, selectShow.value);
    setCurrentDeals(dealsApiCall);
    render(currentDeals, currentPagination);
  });
});

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

buttonHotDeals.addEventListener('click', async () => {
  buttonChangeState(buttonHotDeals);
  if (buttonFavoriteDeals.state === 'on') {
    buttonChangeState(buttonFavoriteDeals);
  }

  const dealsApiCall = await fetchDeals(currentPagination.currentPage, selectShow.value);
  setCurrentDeals(dealsApiCall);

  const dealsWithSales = await Promise.all(dealsApiCall.results.map(async (deal) => {
    let vintedsales = await fetchSales(deal.dealabs.ID, 1, 100);
    return { deal, vintedsales };
  }));

  let temp = dealsWithSales.map(({ deal, vintedsales }) => {
    let dealContent = deal.dealabs;
    let rentabilite = 0;
    if (vintedsales.results.length > 0) {
      let vintedIndicators = calculatePriceIndicators(vintedsales);
      rentabilite = dealContent.price != 0 ? calculateRentability(deal, vintedIndicators) : 0;
    }
    deal.rentabilite = rentabilite;
    return deal;
  });

  if (buttonHotDeals.state === 'on') {
    currentDeals = currentDeals.filter(deal => deal.rentabilite >= rentabilityLevel);
  }
  console.log('Sorted by Hot deals !');
  render(currentDeals, currentPagination);
})


buttonFavoriteDeals.addEventListener('click', async () => {
  buttonChangeState(buttonFavoriteDeals);
  if (buttonHotDeals.state === 'on') {
    buttonChangeState(buttonHotDeals);
  }
  const dealsApiCall = await fetchDeals();
  setCurrentDeals(dealsApiCall);

  if (buttonFavoriteDeals.state === 'on') {
    currentDeals = currentDeals.filter(deal => favoriteDealIds.some(fav => fav.dealId === deal.dealabs.ID && parseFloat(fav.dealPrice) === parseFloat(deal.dealabs.price)));
  }
  console.log('Sorted by Favorite deals !')
  render(currentDeals, currentPagination);
})

selectSort.addEventListener('change', async (event) => {
  switch (event.target.value) {
    case 'price-asc':
      currentParameters.sort = 'priceUp';
      break;
    case 'price-desc':
      currentParameters.sort = 'priceDown';
      break;
    case 'date-asc':
      currentParameters.sort = 'dateUp';
      break;
    case 'date-desc':
      currentParameters.sort = 'dateDown';
    case 'comments-desc':
      currentParameters.sort = 'commentsDown';
      break;
    case 'temperature-desc':
      currentParameters.sort = 'temperatureDown';
      break;
  }
  console.log(`Sorted by ${event.target.value}!`)
  const dealsApiCall = await fetchDeals(currentPagination.currentPage, selectShow.value);
  setCurrentDeals(dealsApiCall);
  render(currentDeals, currentPagination);
});


/*for the popup*/

const calculatePriceIndicators = (sales) => {
  if (!sales.results) {
    return { numberOfSales: 0, oldestDuration: 0, average: 0, p5: 0, p25: 0, p50: 0 };
  } else {
    const numberOfSales = sales.pagination.count;
    const oldestLifetimeValue = sales.results.map(sale => sale.timestamp).sort((a, b) => a - b)[0];
    const oldestDuration = durationSince(oldestLifetimeValue);
    const timeSinceMostRecentOffer = sales.results.map(sale => sale.timestamp).sort((a, b) => b - a)[0];
    const mostRecentOffer = durationSince(timeSinceMostRecentOffer);
    const prices = sales.results.map(sale => parseFloat(sale.price)).sort((a, b) => a - b);
    const avg = (prices.reduce((sum, price) => sum + price, 0) / prices.length).toFixed(2);
    const p5 = prices[Math.floor(prices.length * 0.05)].toFixed(2);
    const p25 = prices[Math.floor(prices.length * 0.25)].toFixed(2);
    const p50 = prices[Math.floor(prices.length * 0.50)].toFixed(2);
    const p75 = prices[Math.floor(prices.length * 0.75)].toFixed(2);
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance).toFixed(2);
    return { numberOfSales, mostRecentOffer, oldestDuration, avg, p5, p25, p50, p75, oldestLifetimeValue, timeSinceMostRecentOffer, stdDev };
  }


};

const vintedTable = async (legoSetId, pagination, sortBy="DateDown") => {
  const sales = await fetchSales(legoSetId, pagination, 5, sortBy);
  const salesTableBody = document.getElementById('vinted-sales');
  salesTableBody.innerHTML = '';
  salesTableBody.innerHTML = sales.results.map(sale => `
  <tr>
  <td>${formatageDate(sale.timestamp)}</td>
  <td><a href="${sale.url}" target="_blank">${sale.title}</a></td>
  <td>${sale.favourite_count}</td>
  <td>${sale.price} €</td>
  <td>${durationSince(sale.timestamp)} ago</td>
  </tr>
`).join('');
  document.getElementById('page-info-vinted').textContent = `Page ${sales.pagination.currentPage} of ${sales.pagination.pageCount}`;
}


const openVintedSalesPopup = async (legoSetId, price) => {
  let sales = await fetchSales(legoSetId, 1, 100);
  const deal = currentDeals.find(d => d.dealabs.ID === legoSetId && parseFloat(price) === parseFloat(d.dealabs.price));


  const vintedSalesContent = document.getElementById('vinted-sales-content');


  if (sales.length === 0) {
    vintedSalesContent.innerHTML = '';
    vintedSalesContent.innerHTML = '<p>No Vinted sales found for this LEGO set.</p>';
  } else {
    const indicators = calculatePriceIndicators(sales);
    sales = await fetchSales(legoSetId, 1, 5);

    const discount = deal.dealabs.nextBestPrice !== 0 ? (100 - (deal.dealabs.price / deal.dealabs.nextBestPrice * 100)).toFixed(0) : 0;

    const avg = indicators.avg;
    const p5 = indicators.p5;
    const p25 = indicators.p25;
    const p50 = indicators.p50;
    const mostRecentDeal = indicators.mostRecentOffer;
    const oldestDeal = indicators.oldestDuration.split(' and')[0];

    document.getElementById('sort-vinted').value = 'date-desc';
    document.getElementById('NbSales').textContent = indicators.numberOfSales;
    document.getElementById('AvgPrice').textContent = `${avg}€`;
    document.getElementById('MostRecentDeal').textContent = `${mostRecentDeal}`;
    document.getElementById('OldestDeal').textContent = `${oldestDeal}`;
    document.getElementById('P50').textContent = `${p50}€`;
    let currentpage = 1;
    await vintedTable(legoSetId, currentpage);






    document.getElementById('vinted-modal').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('close-modal').addEventListener('click', () => {
      document.getElementById('vinted-modal').style.display = 'none';
      document.getElementById('overlay').style.display = 'none'; // Masque l'overlay
    });
    document.getElementById('prev-page-vinted').addEventListener('click', async () => {
      if (currentpage > 1) {
        currentpage -= 1;
        await vintedTable(legoSetId, currentpage);
      }
    });

    

    document.getElementById('next-page-vinted').addEventListener('click', async () => {
      if (currentpage < sales.pagination.pageCount) {
        currentpage += 1;
        await vintedTable(legoSetId, currentpage);
      }
    });

    
    document.getElementById('sort-vinted').addEventListener('change', async (event) => {
      let sortType="";
  
      switch (event.target.value) {
          case 'price-asc':
              sortType = "priceUp";
              break;
          case 'price-desc':
              sortType= "priceDown";
              break;
          case 'favorite-asc':
              sortType = "favouritesUp";
              break;
          case 'favorite-desc':
              sortType = "favouritesDown";
              break;
          default:
              sortType="DateDown" ;
              break;
      }
      await vintedTable(legoSetId, 1, sortType);
  });


  }
};
