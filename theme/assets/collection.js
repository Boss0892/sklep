(function () {
  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function initFilterDrawer() {
    const openBtn = qs("[data-filters-open]");
    const drawer = qs("[data-filters-drawer]");
    const closeBtn = qs("[data-filters-close]");
    const backdrop = qs("[data-filters-backdrop]");
    if (!openBtn || !drawer || !closeBtn || !backdrop) return;

    const open = () => {
      drawer.dataset.open = "true";
      backdrop.dataset.open = "true";
      openBtn.setAttribute("aria-expanded", "true");
      document.documentElement.dataset.scrollLock = "true";
    };

    const close = () => {
      drawer.dataset.open = "false";
      backdrop.dataset.open = "false";
      openBtn.setAttribute("aria-expanded", "false");
      delete document.documentElement.dataset.scrollLock;
    };

    openBtn.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    backdrop.addEventListener("click", close);
  }

  function initLoadMore() {
    const btn = qs("[data-load-more]");
    if (!btn) return;
    const nextUrl = btn.dataset.nextUrl;
    if (!nextUrl) return;
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      try {
        const res = await fetch(nextUrl, { headers: { Accept: "text/html" } });
        if (!res.ok) throw new Error("Nie udało się wczytać kolejnych produktów.");
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const items = qsa("[data-collection-grid] > *", doc);
        const grid = qs("[data-collection-grid]");
        if (!grid) return;
        items.forEach((el) => grid.appendChild(el));
      } catch (err) {
        alert(err?.message || "Błąd wczytywania.");
      } finally {
        btn.disabled = false;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initFilterDrawer();
    initLoadMore();
  });
})();

