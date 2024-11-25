const cheerio = require('cheerio');

/**
 * Parse webpage data response
 * @param  {String} data - HTML response
 * @return {Array} deals - Array of deal objects
 */
const parse = data => {
  const $ = cheerio.load(data, { decodeEntities: true });

  const deallabsData = $('div.js-vue2').filter((_, element) => {
    const dataVue2 = $(element).attr('data-vue2');
    return dataVue2 && dataVue2.match(/ThreadMainListItemNormalizer/);
  });

  console.log(`Found ${deallabsData.length} deals on the page`);

  //data-vue2='{"name":"ThreadMainListItemNormalizer","props":{"thread":{"threadId":"2901712","threadTypeId":1,"titleSlug":"calendrier-de-lavent-lego-harry-potter-2024","title":"Calendrier de l\u2019Avent LEGO Harry Potter 2024","currentUserVoteDirection":"","commentCount":3,"status":"Activated","isExpired":false,"isNew":false,"isPinned":false,"isTrending":false,"isBookmarked":false,"isLocal":false,"temperature":174.53,"temperatureLevel":"Hot2","type":"Deal","nsfw":false,"deletedAt":null,"isAffiliateTrackingDisabled":false,"isAffiliateDescriptionDisabled":false,"isEditLocked":false,"isExpireLocked":false,"contentLockedBy":null,"isSpamLocked":false,"isLocked":false,"isNewsletterPicked":null,"isCommentsModerationOn":null,"isPushed":null,"isCommunityFavorite":false,"isCategoryCommunityFavorite":false,"isTopDeal":false,"isCategoryTopDeal":false,"pinId":null,"publishedAt":1730699025,"voucherCode":"","link":"https://www.e.leclerc/fp/calendrier-de-l-avent-lego-harry-potter-2024-5702017582993","shareableLink":"https://www.dealabs.com/share-deal/2901712","merchant":{"merchantId":195,"merchantName":"E.Leclerc","merchantUrlName":"leclerc","isMerchantPageEnabled":true,"avatar":{"path":"merchants/raw/avatar","name":"195_3","slotId":"avatar","width":0,"height":0,"version":3,"unattached":false,"uid":"195_3.raw","ext":"raw"}},"mainGroup":{"threadGroupId":8,"threadGroupName":"Culture & Divertissement","threadGroupUrlName":"culture-divertissement"},"mainImage":{"path":"threads/raw/gCzRT","name":"2901712_1","slotId":"gCzRT","width":240,"height":240,"version":1,"unattached":false,"uid":"2901712_1.jpg","ext":"jpg"},"price":24.9,"nextBestPrice":34.9,"percentage":0,"discountType":null,"shipping":{"isFree":null,"price":0},"user":{"userId":70222,"username":"Boupou","title":"","avatar":{"path":"users/raw/default","name":"70222_1","slotId":"default","width":0,"height":0,"version":1,"unattached":false,"uid":"70222_1.raw","ext":"raw"},"persona":{"text":null,"type":null},"isBanned":false,"isDeletedOrPendingDeletion":false,"isUserProfileHidden":false},"startDate":{"timestamp":1730674860},"selectedLocations":{"isNational":false},"endDate":{"timestamp":1731884340},"isExclusive":false,"isVoucherCodeHidden":false,"claimCodeCampaignId":null,"claimCodeCampaign":null}}}'></div>
  const deals = [];

  deallabsData.each((_, element) => {
    const dataVue2 = $(element).attr('data-vue2');

    if (dataVue2) {
      const data = JSON.parse(dataVue2);
      if (data.props && data.props.thread) {
        const thread = data.props.thread;
        const titleExists = thread.title && thread.title.length > 0;
        const deal = {
          threadId: thread.threadId,
          title: thread.title,
          ID: titleExists && thread.title.match(/\b\d{5}\b/) != null ? thread.title.match(/\b\d{5}\b/)[0] : null,
          link: thread.link,
          commentCount: thread.commentCount,
          status: thread.status,
          merchant: thread.merchant ? thread.merchant.merchantName : 'Unknown',
          price: thread.price,
          nextBestPrice: thread.nextBestPrice,
          temperature: thread.temperature,
          temperatureLevel: thread.temperatureLevel,
          commentCount: thread.commentCount,
          publishedAt: thread.publishedAt,
          mainImage: thread.mainImage ? `https://static.dealabs.com/${thread.mainImage.path}/${thread.mainImage.name}.${thread.mainImage.ext}` : null,
          isExpired: thread.isExpired,
          isNew: thread.isNew,
          isPinned: thread.isPinned,
          isTrending: thread.isTrending,
          currentUserVoteDirection : thread.currentUserVoteDirection,
        };
        // Only add deals that have a title and link, indicating full data
        if (deal.title && deal.link) {
          deals.push(deal);
        }
      }
    }
  });


  return deals;


};

/**
 * Scrape a given URL page
 * @param {String} url - URL to parse
 * @returns {Array|null} Array of deals or null on error
 */
module.exports.scrape = async baseUrl => {
  const fetch = (await import('node-fetch')).default;
  const allDeals = [];
  let page = 1;
  let hasMoreDeals = true;

  try {
    while (hasMoreDeals) {
      const url = `${baseUrl}&page=${page}`;
      console.log(`Fetching ${url}...`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });

      if (response.ok) {
        const body = await response.text();
        const deals = parse(body);

        if (deals.length > 0) {
          allDeals.push(...deals);
          page++;
        } else {
          hasMoreDeals = false;
          console.log('No more deals found.');
        }
      } else {
        console.error(`No more deal : ${response.status} from ${url}`);
        hasMoreDeals = false;
      }
    }

    return allDeals;
  } catch (error) {
    console.error(`Error fetching data:`, error);
    return null;
  }
};