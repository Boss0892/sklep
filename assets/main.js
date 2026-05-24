/* =========================================================
   ChargeHub — Shopify Theme JavaScript
   Uses Shopify AJAX Cart API
   ========================================================= */

'use strict';

/* ---- Helpers ---- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ---- Format money ---- */
function formatMoney(cents) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: window.Shopify?.currency?.active || 'USD' });
}

/* ---- Toast ---- */
function showToast(msg, type = 'info') {
  let container = $('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.4s, transform 0.4s';
    el.style.opacity = '0';
    el.style.transform = 'translateX(80px)';
    setTimeout(() => el.remove(), 420);
  }, 3200);
}

/* ================================================================
   CART DRAWER
   ================================================================ */
const CartDrawer = (() => {
  let drawerEl, overlayEl, bodyEl, subtotalEl, countEls;

  function init() {
    drawerEl   = $('.cart-drawer');
    overlayEl  = $('.cart-drawer__overlay');
    bodyEl     = drawerEl && $('.cart-drawer__body', drawerEl);
    subtotalEl = drawerEl && $('.cart-drawer__subtotal-value', drawerEl);
    countEls   = $$('[data-cart-count]');

    if (!drawerEl) return;

    $('.cart-drawer__close', drawerEl)?.addEventListener('click', close);
    overlayEl?.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

    $$('[data-open-cart]').forEach(btn => btn.addEventListener('click', () => open()));
  }

  function open() {
    drawerEl.classList.add('is-open');
    overlayEl?.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    renderCart();
  }

  function close() {
    drawerEl.classList.remove('is-open');
    overlayEl?.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  async function renderCart() {
    if (!bodyEl) return;
    bodyEl.innerHTML = '<p style="text-align:center;padding:40px 0;color:var(--color-muted)">Loading…</p>';
    try {
      const cart = await fetch('/cart.js').then(r => r.json());
      updateCount(cart.item_count);
      updateSubtotal(cart.total_price);

      if (cart.item_count === 0) {
        bodyEl.innerHTML = `
          <div class="cart-drawer__empty">
            <div class="cart-drawer__empty-icon">🛒</div>
            <p>Your cart is empty</p>
            <a href="/collections/all" class="btn btn--primary btn--sm" style="margin-top:12px">Shop Now</a>
          </div>`;
        return;
      }

      bodyEl.innerHTML = cart.items.map(item => `
        <div class="cart-line" data-variant-id="${item.variant_id}" data-key="${item.key}">
          <div class="cart-line__image">
            ${item.image ? `<img src="${item.image}" alt="${item.title}" loading="lazy">` : ''}
          </div>
          <div class="cart-line__info">
            <div class="cart-line__title">${item.product_title}</div>
            ${item.variant_title && item.variant_title !== 'Default Title' ? `<div class="cart-line__variant">${item.variant_title}</div>` : ''}
            <div class="cart-line__price">${formatMoney(item.final_line_price)}</div>
            <div class="cart-line__qty-row">
              <button class="qty-btn" data-action="decrement" data-key="${item.key}">−</button>
              <span class="qty-display">${item.quantity}</span>
              <button class="qty-btn" data-action="increment" data-key="${item.key}">+</button>
            </div>
          </div>
          <button class="cart-line__remove" data-key="${item.key}" title="Remove">✕</button>
        </div>`).join('');

      // Bind events
      bodyEl.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const key = btn.dataset.key;
          const line = btn.closest('.cart-line');
          const qty  = parseInt(line.querySelector('.qty-display').textContent, 10);
          const newQty = btn.dataset.action === 'increment' ? qty + 1 : qty - 1;
          await updateLineItem(key, Math.max(0, newQty));
          renderCart();
        });
      });
      bodyEl.querySelectorAll('.cart-line__remove').forEach(btn => {
        btn.addEventListener('click', async () => {
          await updateLineItem(btn.dataset.key, 0);
          renderCart();
        });
      });
    } catch {
      bodyEl.innerHTML = '<p style="text-align:center;padding:40px;color:var(--color-muted)">Could not load cart.</p>';
    }
  }

  async function updateLineItem(key, quantity) {
    return fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity })
    }).then(r => r.json());
  }

  function updateCount(count) {
    countEls = $$('[data-cart-count]');
    countEls.forEach(el => {
      el.textContent = count;
      el.dataset.count = count;
    });
  }

  function updateSubtotal(cents) {
    if (subtotalEl) subtotalEl.textContent = formatMoney(cents);
  }

  return { init, open, close, renderCart, updateCount };
})();

/* ================================================================
   ADD TO CART
   ================================================================ */
async function addToCart(variantId, quantity = 1, properties = {}) {
  const response = await fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: variantId, quantity, properties })
  });
  if (!response.ok) throw new Error('Could not add to cart');
  return response.json();
}

function initAddToCartForms() {
  // Product form on product page
  $$('[data-product-form]').forEach(form => {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const btn        = this.querySelector('[data-atc-btn]');
      const variantSel = this.querySelector('[name="id"]');
      const qtySel     = this.querySelector('[name="quantity"]');
      if (!variantSel) return;
      const variantId  = variantSel.value;
      const quantity   = qtySel ? parseInt(qtySel.value, 10) : 1;

      if (btn) { btn.classList.add('is-loading'); btn.textContent = 'Adding…'; }
      try {
        await addToCart(variantId, quantity);
        if (btn) { btn.classList.remove('is-loading'); btn.classList.add('is-added'); btn.textContent = '✓ Added to Cart'; }
        CartDrawer.open();
        setTimeout(() => {
          if (btn) { btn.classList.remove('is-added'); btn.textContent = btn.dataset.text || 'Add to Cart'; }
        }, 2000);
      } catch {
        showToast('Could not add to cart. Please try again.', 'error');
        if (btn) { btn.classList.remove('is-loading'); btn.textContent = btn.dataset.text || 'Add to Cart'; }
      }
    });
  });

  // Quick-add buttons on collection / featured product cards
  $$('[data-quick-add]').forEach(btn => {
    btn.addEventListener('click', async function () {
      const variantId = this.dataset.variantId;
      if (!variantId) return;
      const orig = this.innerHTML;
      this.classList.add('is-loading');
      this.innerHTML = 'Adding…';
      try {
        await addToCart(variantId, 1);
        this.classList.remove('is-loading');
        this.classList.add('is-added');
        this.innerHTML = '✓ Added';
        CartDrawer.open();
        setTimeout(() => { this.classList.remove('is-added'); this.innerHTML = orig; }, 2000);
      } catch {
        showToast('Could not add to cart.', 'error');
        this.classList.remove('is-loading');
        this.innerHTML = orig;
      }
    });
  });
}

/* ================================================================
   VARIANT SELECTOR (Product Page)
   ================================================================ */
function initVariantSelector() {
  $$('[data-variant-selector]').forEach(selector => {
    const form      = selector.closest('[data-product-form]');
    const hiddenId  = form && form.querySelector('[name="id"]');
    const priceEl   = form && form.closest('.product-info')?.querySelector('[data-product-price]');
    const compareEl = form && form.closest('.product-info')?.querySelector('[data-product-price-compare]');

    selector.querySelectorAll('.variant-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        selector.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('is-selected'));
        this.classList.add('is-selected');
        if (hiddenId) hiddenId.value = this.dataset.variantId;

        // Update price display
        const price   = this.dataset.price;
        const compare = this.dataset.priceCompare;
        if (priceEl && price)   priceEl.textContent   = formatMoney(parseInt(price, 10));
        if (compareEl && compare && compare !== price) {
          compareEl.textContent = formatMoney(parseInt(compare, 10));
          compareEl.style.display = '';
        } else if (compareEl) {
          compareEl.style.display = 'none';
        }
      });
    });
  });
}

/* ================================================================
   QUANTITY STEPPER (Product Page)
   ================================================================ */
function initQtyStepper() {
  $$('[data-qty-stepper]').forEach(stepper => {
    const input = stepper.querySelector('input[name="quantity"]');
    stepper.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const current = parseInt(input.value, 10) || 1;
        input.value = btn.dataset.action === 'increment'
          ? current + 1
          : Math.max(1, current - 1);
      });
    });
  });
}

/* ================================================================
   PRODUCT GALLERY THUMBNAILS
   ================================================================ */
function initProductGallery() {
  $$('.product-gallery__thumb').forEach(thumb => {
    thumb.addEventListener('click', function () {
      const mainImg = $('.product-gallery__main img');
      if (mainImg && this.dataset.src) {
        mainImg.src = this.dataset.src;
        mainImg.srcset = '';
      }
      $$('.product-gallery__thumb').forEach(t => t.classList.remove('is-active'));
      this.classList.add('is-active');
    });
  });
}

/* ================================================================
   MOBILE NAV DRAWER
   ================================================================ */
function initMobileNav() {
  const hamburger = $('.hamburger');
  const drawer    = $('.mobile-drawer');
  const overlay   = $('.mobile-drawer__overlay');
  const closeBtn  = $('.mobile-drawer__close');
  if (!hamburger || !drawer) return;

  function open()  { drawer.classList.add('is-open');    hamburger.setAttribute('aria-expanded', 'true');  document.body.style.overflow = 'hidden'; }
  function close() { drawer.classList.remove('is-open'); hamburger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }

  hamburger.addEventListener('click', open);
  overlay?.addEventListener('click', close);
  closeBtn?.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

/* ================================================================
   FILTER CHIPS (Collection Page)
   ================================================================ */
function initFilterChips() {
  const chips = $$('.chip[data-filter]');
  const cards = $$('.product-card[data-category]');
  if (!chips.length) return;

  chips.forEach(chip => {
    chip.addEventListener('click', function () {
      chips.forEach(c => c.classList.remove('is-active'));
      this.classList.add('is-active');
      const filter = this.dataset.filter;
      cards.forEach(card => {
        card.style.display = (filter === 'all' || card.dataset.category === filter) ? '' : 'none';
      });
    });
  });
}

/* ================================================================
   SORT SELECT (Collection Page)
   ================================================================ */
function initSortSelect() {
  const select = $('.sort-select');
  const grid   = $('.product-grid');
  if (!select || !grid) return;

  select.addEventListener('change', function () {
    const cards = [...grid.querySelectorAll('.product-card')];
    cards.sort((a, b) => {
      const pa = parseFloat(a.dataset.price || 0);
      const pb = parseFloat(b.dataset.price || 0);
      if (this.value === 'price-asc')  return pa - pb;
      if (this.value === 'price-desc') return pb - pa;
      return 0;
    });
    cards.forEach(c => grid.appendChild(c));
  });
}

/* ================================================================
   NEWSLETTER FORM
   ================================================================ */
function initNewsletter() {
  $$('.newsletter-form').forEach(form => {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = this.querySelector('input[type="email"]');
      if (input?.value) {
        showToast(`📧 Subscribed! Check ${input.value} for your discount.`, 'success');
        input.value = '';
      }
    });
  });
}

/* ================================================================
   SCROLL ANIMATIONS
   ================================================================ */
function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) return;
  const targets = $$('.product-card, .feature-card, .category-card, .testimonial-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}

/* ================================================================
   WISHLIST (localStorage, client-side only)
   ================================================================ */
function initWishlist() {
  const key     = 'chargehub_wishlist';
  const getList = () => JSON.parse(localStorage.getItem(key) || '[]');
  const setList = (l) => localStorage.setItem(key, JSON.stringify(l));

  $$('[data-wishlist-btn]').forEach(btn => {
    const id = btn.dataset.productId;
    if (getList().includes(id)) btn.classList.add('is-wishlisted');
    btn.addEventListener('click', function () {
      const list = getList();
      const idx  = list.indexOf(id);
      if (idx === -1) {
        list.push(id);
        this.classList.add('is-wishlisted');
        showToast('❤️ Added to wishlist', 'success');
      } else {
        list.splice(idx, 1);
        this.classList.remove('is-wishlisted');
        showToast('Removed from wishlist', 'info');
      }
      setList(list);
    });
  });
}

/* ================================================================
   INIT
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  CartDrawer.init();
  initAddToCartForms();
  initVariantSelector();
  initQtyStepper();
  initProductGallery();
  initMobileNav();
  initFilterChips();
  initSortSelect();
  initNewsletter();
  initScrollAnimations();
  initWishlist();
});
