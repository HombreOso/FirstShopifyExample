const LOCAL_STORAGE_WISHLIST_KEY = 'shopify-wishlist';
const LOCAL_STORAGE_DELIMITER = ',';
const BUTTON_ACTIVE_CLASS = 'active';
const GRID_LOADED_CLASS = 'loaded';

const selectors = {
  button: '.button-wishlist',
  grid: '[grid-wishlist]',
  productCard: '.card__content',
};

document.addEventListener('DOMContentLoaded', () => {
  initButtons();
  initGrid();
});

document.addEventListener('shopify-wishlist:updated', (event) => {
  console.log('[Shopify Wishlist] Wishlist Updated ✅', event.detail.wishlist);
  initGrid();
  initButtons();
});

document.addEventListener('shopify-wishlist:init-product-grid', (event) => {
  console.log('[Shopify Wishlist] Wishlist Product List Loaded ✅', event.detail.wishlist);
});

document.addEventListener('shopify-wishlist:init-buttons', (event) => {
  console.log('[Shopify Wishlist] Wishlist Buttons Loaded ✅', event.detail.wishlist);
});

const fetchProductCardHTML = (handle) => {
  const productTileTemplateUrl = `/products/${handle}?view=card`;
  return fetch(productTileTemplateUrl)
    .then((res) => res.text())
    .then((res) => {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = res;
      const productCard = wrapper.querySelector(selectors.productCard);
      return productCard ? productCard.outerHTML : '';
    })
    .catch((err) => console.error(`[Shopify Wishlist] Failed to load content for handle: ${handle}`, err));
};

const setupGrid = async (grid) => {
  const wishlist = getWishlist();
  const productCardsHTML = await Promise.all(wishlist.map(fetchProductCardHTML));
  grid.innerHTML = productCardsHTML.join('');
  grid.classList.add(GRID_LOADED_CLASS);
  initButtons();

  const event = new CustomEvent('shopify-wishlist:init-product-grid', {
    detail: { wishlist: wishlist },
  });
  document.dispatchEvent(event);
};

const handleButtonClick = (button, productHandle) => () => {
  console.log(`[Shopify Wishlist] Button clicked for handle: ${productHandle}`);
  updateWishlist(productHandle);
  button.classList.toggle(BUTTON_ACTIVE_CLASS);
};

const setupButtons = (buttons) => {
  buttons.forEach((button) => {
    const productHandle = button.dataset.productHandle;
    if (!productHandle) {
      console.error('[Shopify Wishlist] Missing `data-product-handle` attribute. Failed to update the wishlist.');
      return;
    }

    if (wishlistContains(productHandle)) {
      button.classList.add(BUTTON_ACTIVE_CLASS);
    } else {
      button.classList.remove(BUTTON_ACTIVE_CLASS);
    }

    // Remove existing event listeners if any
    button.removeEventListener('click', button._wishlistClickHandler);

    // Attach the event listener and store the reference
    button._wishlistClickHandler = handleButtonClick(button, productHandle);
    button.addEventListener('click', button._wishlistClickHandler);
  });
  console.log('buttons', buttons);
};

const initGrid = () => {
  const grid = document.querySelector(selectors.grid) || false;
  if (grid) setupGrid(grid);
};

const initButtons = () => {
  const buttons = document.querySelectorAll(selectors.button) || [];
  console.log('buttons', buttons);
  if (buttons.length) setupButtons(buttons);
  else return;
  const event = new CustomEvent('shopify-wishlist:init-buttons', {
    detail: { wishlist: getWishlist() },
  });
  document.dispatchEvent(event);
};

const getWishlist = () => {
  const wishlist = localStorage.getItem(LOCAL_STORAGE_WISHLIST_KEY);
  return wishlist ? wishlist.split(LOCAL_STORAGE_DELIMITER) : [];
};

const setWishlist = (array) => {
  const wishlist = array.join(LOCAL_STORAGE_DELIMITER);
  if (array.length) {
    localStorage.setItem(LOCAL_STORAGE_WISHLIST_KEY, wishlist);
  } else {
    localStorage.removeItem(LOCAL_STORAGE_WISHLIST_KEY);
  }

  const event = new CustomEvent('shopify-wishlist:updated', {
    detail: { wishlist: array },
  });
  document.dispatchEvent(event);

  return wishlist;
};

const updateWishlist = (handle) => {
  let wishlist = getWishlist();
  const index = wishlist.indexOf(handle);
  if (index === -1) {
    wishlist.push(handle);
  } else {
    wishlist.splice(index, 1);
  }
  setWishlist(wishlist);
  return wishlist;
};

const wishlistContains = (handle) => {
  const wishlist = getWishlist();
  const contains = wishlist.includes(handle);
  console.log(`[Shopify Wishlist] Check if wishlist contains "${handle}": ${contains}`);
  return contains;
};

const resetWishlist = () => {
  return setWishlist([]);
};

window.toggleWishlist = function (element) {
  console.log('toggleWishlist function called');
  element.classList.toggle('active');

  // Optionally, add more functionality here
  console.log('Element classes after toggle:', element.classList);
};
