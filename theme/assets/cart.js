(function () {
  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  async function updateCart(line, quantity) {
    const res = await fetch("/cart/change.js", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ line, quantity }),
    });
    if (!res.ok) throw new Error("Nie udało się zaktualizować koszyka.");
    return res.json();
  }

  function formatMoney(cents) {
    return (cents / 100).toFixed(2).replace(".", ",") + " zł";
  }

  function renderFreeShipping(cart, thresholdCents) {
    const el = qs("[data-free-shipping]");
    if (!el) return;
    if (!thresholdCents) {
      el.hidden = true;
      return;
    }
    const remaining = Math.max(0, thresholdCents - (cart.items_subtotal_price || 0));
    el.hidden = false;
    el.textContent =
      remaining === 0
        ? "Masz darmową dostawę."
        : `Brakuje Ci ${formatMoney(remaining)} do darmowej dostawy.`;
  }

  async function refreshCart() {
    const res = await fetch("/cart.js", { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return res.json();
  }

  async function handleQuantityChange(button) {
    const line = Number(button.dataset.line);
    const delta = Number(button.dataset.delta);
    const input = qs(`[data-line-input='${line}']`);
    if (!line || !input) return;
    const current = Number(input.value) || 0;
    const next = Math.max(0, current + delta);
    input.value = String(next);

    const cart = await updateCart(line, next);
    const item = cart.items?.[line - 1];
    const row = qs(`[data-line-row='${line}']`);
    if (row && item) {
      const lineTotal = qs("[data-line-total]", row);
      const lineQty = qs("[data-line-qty]", row);
      if (lineTotal) lineTotal.textContent = formatMoney(item.final_line_price);
      if (lineQty) lineQty.textContent = String(item.quantity);
      row.hidden = item.quantity === 0;
    }

    const subtotal = qs("[data-cart-subtotal]");
    if (subtotal) subtotal.textContent = formatMoney(cart.items_subtotal_price);

    const thresholdCents = Number(qs("[data-cart-root]")?.dataset?.freeShippingThresholdCents || 0);
    renderFreeShipping(cart, thresholdCents);
  }

  function initCartPage() {
    const root = qs("[data-cart-root]");
    if (!root) return;

    qsa("[data-qty-btn]", root).forEach((btn) => {
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        try {
          await handleQuantityChange(btn);
        } catch (err) {
          alert(err?.message || "Błąd aktualizacji koszyka.");
        } finally {
          btn.disabled = false;
          document.dispatchEvent(new CustomEvent("sklep:cart-updated"));
        }
      });
    });

    qsa("[data-remove-btn]", root).forEach((btn) => {
      btn.addEventListener("click", async () => {
        const line = Number(btn.dataset.line);
        if (!line) return;
        btn.disabled = true;
        try {
          const cart = await updateCart(line, 0);
          const row = qs(`[data-line-row='${line}']`);
          if (row) row.hidden = true;
          const subtotal = qs("[data-cart-subtotal]");
          if (subtotal) subtotal.textContent = formatMoney(cart.items_subtotal_price);
          const thresholdCents = Number(root.dataset.freeShippingThresholdCents || 0);
          renderFreeShipping(cart, thresholdCents);
        } catch (err) {
          alert(err?.message || "Błąd usuwania produktu.");
        } finally {
          btn.disabled = false;
          document.dispatchEvent(new CustomEvent("sklep:cart-updated"));
        }
      });
    });

    document.addEventListener("sklep:cart-updated", async () => {
      const cart = await refreshCart();
      if (!cart) return;
      const subtotal = qs("[data-cart-subtotal]");
      if (subtotal) subtotal.textContent = formatMoney(cart.items_subtotal_price);
      const thresholdCents = Number(root.dataset.freeShippingThresholdCents || 0);
      renderFreeShipping(cart, thresholdCents);
    });
  }

  document.addEventListener("DOMContentLoaded", initCartPage);
})();
