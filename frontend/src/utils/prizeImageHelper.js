/**
 * Official Prize Asset Catalog
 * Only uses existing official assets in frontend/public/assets/prizes/
 */
export const OFFICIAL_PRIZE_ASSETS = {
  IPHONE_15_PRO: '/assets/prizes/iphone-15-pro.png',
  APPLE_WATCH_S9: '/assets/prizes/apple-watch-s9.png',
  AIRPODS_PRO: '/assets/prizes/airpods-pro.png',
  AMAZON_2000: '/assets/prizes/amazon-gift-card-2000.png',
  AMAZON_500: '/assets/prizes/amazon-gift-card-500.png',
  AMAZON_200: '/assets/prizes/amazon-gift-card-200.png',
  GIFT_BOX_PEDESTAL: '/assets/prizes/gift-box-pedestal.png',
  GIFT_BOX_RIBBON: '/assets/prizes/gift-box-ribbon.png',
  TICKET: '/assets/prizes/ticket-giveaway.png',
};

/**
 * Resolves the accurate official prize image based on prize name, pool title, slug, and existing image.
 * Solves the bug where default backend/test fixture fallbacks assign iphone-15-pro.png to all winners.
 *
 * @param {Object|string} prizeOrWinner - Prize name string or entire winner/giveaway object
 * @param {string} [giveawayTitle] - Pool/Giveaway title
 * @param {string} [currentImage] - Currently assigned image URL from backend or props
 * @returns {string} Official image asset path
 */
export const resolvePrizeImage = (prizeOrWinner, giveawayTitle = '', currentImage = '') => {
  let prizeName = '';
  let poolTitle = giveawayTitle || '';
  let slug = '';
  let rawImage = currentImage || '';

  if (typeof prizeOrWinner === 'object' && prizeOrWinner !== null) {
    prizeName = prizeOrWinner.prize || prizeOrWinner.prizeName || prizeOrWinner.title || '';
    poolTitle = prizeOrWinner.giveawayTitle || prizeOrWinner.poolTitle || poolTitle;
    slug = prizeOrWinner.slug || '';
    rawImage = prizeOrWinner.prizeImage || prizeOrWinner.imageUrl || rawImage;
  } else if (typeof prizeOrWinner === 'string') {
    prizeName = prizeOrWinner;
  }

  const text = `${prizeName} ${poolTitle} ${slug}`.toLowerCase();

  // 1. Amazon Gift Cards / Vouchers / Pay Cards / E-Cards (Must NEVER show iPhone!)
  if (
    text.includes('amazon') ||
    text.includes('gift card') ||
    text.includes('gift voucher') ||
    text.includes('pay gift') ||
    text.includes('pay e-gift') ||
    text.includes('pay voucher') ||
    text.includes('e-voucher') ||
    text.includes('e-gift') ||
    text.includes('voucher') ||
    slug.includes('amazon') ||
    slug.includes('voucher')
  ) {
    if (
      text.includes('2000') ||
      text.includes('2,000') ||
      text.includes('2k') ||
      slug.includes('2000') ||
      text.includes('5000') ||
      text.includes('5,000')
    ) {
      return OFFICIAL_PRIZE_ASSETS.AMAZON_2000;
    }
    if (text.includes('500') || slug.includes('500')) {
      return OFFICIAL_PRIZE_ASSETS.AMAZON_500;
    }
    if (
      text.includes('200') ||
      text.includes('₹200') ||
      text.includes('₹20') ||
      text.includes('20 ') ||
      slug.includes('20') ||
      slug.includes('200')
    ) {
      return OFFICIAL_PRIZE_ASSETS.AMAZON_200;
    }
    // Generic Amazon fallback
    return OFFICIAL_PRIZE_ASSETS.AMAZON_500;
  }

  // 2. Apple Watch / Smartwatch
  if (
    text.includes('watch') ||
    text.includes('s9') ||
    text.includes('series 9') ||
    text.includes('series-9') ||
    text.includes('smartwatch') ||
    slug.includes('watch')
  ) {
    return OFFICIAL_PRIZE_ASSETS.APPLE_WATCH_S9;
  }

  // 3. Apple AirPods / Earbuds / Headphones
  if (
    text.includes('airpod') ||
    text.includes('earbud') ||
    text.includes('earphone') ||
    text.includes('headphone') ||
    text.includes('magsafe case') ||
    slug.includes('airpod')
  ) {
    return OFFICIAL_PRIZE_ASSETS.AIRPODS_PRO;
  }

  // 4. Apple iPhone / Smartphone
  if (
    text.includes('iphone') ||
    text.includes('15 pro') ||
    text.includes('titanium') ||
    slug.includes('iphone') ||
    text.includes('smartphone') ||
    text.includes('phone') ||
    text.includes('mobile')
  ) {
    return OFFICIAL_PRIZE_ASSETS.IPHONE_15_PRO;
  }

  // 5. Tickets / Token Passes / Giveaways
  if (text.includes('ticket') || text.includes('pass') || slug.includes('ticket')) {
    return OFFICIAL_PRIZE_ASSETS.TICKET;
  }

  // 6. Generic Gift / MacBook / Laptop / Pedestal
  if (text.includes('macbook') || text.includes('laptop') || text.includes('pedestal')) {
    return OFFICIAL_PRIZE_ASSETS.GIFT_BOX_PEDESTAL;
  }

  // 7. Ribbon Gift Box
  if (text.includes('gift box') || text.includes('ribbon') || text.includes('mystery box')) {
    return OFFICIAL_PRIZE_ASSETS.GIFT_BOX_RIBBON;
  }

  // 8. If existing image is already a valid specific asset other than generic iphone fallback, preserve it
  if (
    rawImage &&
    rawImage !== OFFICIAL_PRIZE_ASSETS.IPHONE_15_PRO &&
    Object.values(OFFICIAL_PRIZE_ASSETS).includes(rawImage)
  ) {
    return rawImage;
  }

  // 9. Safe Default Fallback
  return OFFICIAL_PRIZE_ASSETS.IPHONE_15_PRO;
};

/**
 * Normalizes a winner object by resolving its prizeImage.
 * Preserves all other properties (names, statuses, dates, titles, etc.) intact.
 */
export const normalizeWinnerPrizeImage = (winner) => {
  if (!winner || typeof winner !== 'object') return winner;
  return {
    ...winner,
    prizeImage: resolvePrizeImage(winner),
  };
};

/**
 * Normalizes a giveaway object by resolving its prizeImage.
 */
export const normalizeGiveawayPrizeImage = (giveaway) => {
  if (!giveaway || typeof giveaway !== 'object') return giveaway;
  return {
    ...giveaway,
    prizeImage: resolvePrizeImage(giveaway),
  };
};

export default resolvePrizeImage;
