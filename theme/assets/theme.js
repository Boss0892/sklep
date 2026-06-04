(function () {
  const state = {
    cartCount: null,
  };

  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function setExpanded(button, expanded) {
    button.setAttribute("aria-expanded", expanded ? "true" : "false");
  }

  function initMobileMenu() {
    const buttons = qsa("[data-mobile-menu-toggle]");
    const drawer = qs("[data-mobile-drawer]");
    const backdrop = qs("[data-mobile-backdrop]");
    const primaryButton = buttons[0];
    if (!primaryButton || !drawer || !backdrop) return;

    const open = () => {
      drawer.dataset.open = "true";
      backdrop.dataset.open = "true";
      setExpanded(primaryButton, true);
      document.documentElement.dataset.scrollLock = "true";
      drawer.querySelector("a, button")?.focus();
    };

    const close = () => {
      drawer.dataset.open = "false";
      backdrop.dataset.open = "false";
      setExpanded(primaryButton, false);
      delete document.documentElement.dataset.scrollLock;
      primaryButton.focus();
    };

    buttons.forEach((btn) =>
      btn.addEventListener("click", () => {
        const isOpen = drawer.dataset.open === "true";
        (isOpen ? close : open)();
      })
    );
    backdrop.addEventListener("click", close);
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (drawer.dataset.open === "true") close();
    });
  }

  async function refreshCartCount() {
    const badge = qs("[data-cart-count]");
    if (!badge) return;

    try {
      const res = await fetch("/cart.js", { headers: { Accept: "application/json" } });
      if (!res.ok) return;
      const cart = await res.json();
      state.cartCount = cart.item_count || 0;
      badge.textContent = String(state.cartCount);
      badge.hidden = state.cartCount === 0;
    } catch {
      // silent
    }
  }

  async function addToCart(form) {
    const submit = form.querySelector("[type='submit']");
    const originalText = submit?.textContent;
    if (submit) {
      submit.disabled = true;
      submit.dataset.loading = "true";
      submit.textContent = submit.dataset.loadingText || "Dodawanie…";
    }

    try {
      const formData = new FormData(form);
      const res = await fetch("/cart/add.js", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.description || "Nie udało się dodać do koszyka.");
      }
      await refreshCartCount();
      document.dispatchEvent(new CustomEvent("sklep:cart-updated"));
    } finally {
      if (submit) {
        submit.disabled = false;
        delete submit.dataset.loading;
        submit.textContent = originalText || "Dodaj do koszyka";
      }
    }
  }

  function initAjaxAddToCart() {
    qsa("form[data-ajax-add-to-cart]").forEach((form) => {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
          await addToCart(form);
        } catch (err) {
          alert(err?.message || "Błąd dodawania do koszyka.");
        }
      });
    });
  }

  function initScrollLock() {
    const style = document.createElement("style");
    style.textContent = "html[data-scroll-lock='true']{overflow:hidden}";
    document.head.appendChild(style);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initScrollLock();
    initMobileMenu();
    initAjaxAddToCart();
    refreshCartCount();
    document.addEventListener("sklep:cart-updated", refreshCartCount);
  });
})();
