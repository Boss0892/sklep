(function () {
  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function initGallery() {
    const root = qs("[data-product-gallery]");
    if (!root) return;

    const main = qs("[data-gallery-main]", root);
    const thumbs = qsa("[data-gallery-thumb]", root);
    if (!main || thumbs.length === 0) return;

    thumbs.forEach((thumb) => {
      thumb.addEventListener("click", () => {
        const src = thumb.dataset.src;
        if (!src) return;
        main.setAttribute("src", src);
        main.setAttribute("srcset", "");
        thumbs.forEach((t) => t.dataset.active && delete t.dataset.active);
        thumb.dataset.active = "true";
      });
    });

    main.addEventListener("click", () => {
      const dialog = qs("[data-lightbox]");
      const img = qs("[data-lightbox-img]");
      if (!dialog || !img) return;
      img.src = main.getAttribute("src") || "";
      dialog.showModal?.();
    });

    const dialog = qs("[data-lightbox]");
    dialog?.addEventListener("click", (e) => {
      const rect = dialog.getBoundingClientRect();
      const inDialog =
        rect.top <= e.clientY && e.clientY <= rect.top + rect.height && rect.left <= e.clientX && e.clientX <= rect.left + rect.width;
      if (!inDialog) dialog.close();
    });
  }

  function initQuantityControls() {
    qsa("[data-qty-root]").forEach((root) => {
      const input = qs("input[type='number']", root);
      const minus = qs("[data-qty-minus]", root);
      const plus = qs("[data-qty-plus]", root);
      if (!input || !minus || !plus) return;
      minus.addEventListener("click", () => (input.value = String(Math.max(1, (Number(input.value) || 1) - 1))));
      plus.addEventListener("click", () => (input.value = String((Number(input.value) || 1) + 1)));
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initGallery();
    initQuantityControls();
  });
})();

