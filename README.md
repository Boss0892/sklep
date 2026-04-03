# ChargeHub — Shopify Theme

A professional, marketing-ready Shopify theme for a dropshipping store selling phone chargers, power banks, and charging accessories.

## Theme Structure

```
├── assets/
│   ├── style.css      # Full responsive stylesheet
│   └── main.js        # Shopify AJAX cart + interactivity
├── config/
│   ├── settings_data.json
│   └── settings_schema.json
├── layout/
│   └── theme.liquid   # Master layout (cart drawer, mobile nav)
├── locales/
│   └── en.default.json
├── sections/
│   ├── announcement-bar.liquid
│   ├── header.liquid
│   ├── footer.liquid
│   ├── hero-banner.liquid        # Full-width hero with stats
│   ├── trust-bar.liquid          # Free shipping / returns strip
│   ├── category-list.liquid      # Shop by category cards
│   ├── featured-collection.liquid # Product grid from a collection
│   ├── features-grid.liquid      # Why us / benefits
│   ├── promo-banner.liquid       # Promotional CTA banner
│   ├── testimonials.liquid       # Customer reviews
│   ├── newsletter.liquid         # Email signup (Shopify form)
│   └── main-page.liquid          # Generic page template
├── snippets/
│   ├── product-card.liquid           # Reusable product card
│   └── product-card-placeholder.liquid # Placeholder before collection set
└── templates/
    ├── index.json        # Homepage — all sections pre-configured
    ├── collection.liquid # Collection page with filter chips
    ├── product.liquid    # Product page with variant selector
    ├── cart.liquid       # Cart page with order summary
    └── page.json         # Generic page
```

## How to Install on Shopify

1. In your Shopify admin go to **Online Store → Themes**.
2. Click **Add theme → Upload zip file** and upload a ZIP of this folder.
3. Click **Customize** to edit section content, colours and fonts via the Theme Editor.
4. Connect your collections to the **Featured Collection** section.
5. Set up navigation links under **Online Store → Navigation → Main menu**.

## Recommended Collections

| Handle | Title |
|--------|-------|
| `chargers` | Phone Chargers |
| `power-banks` | Power Banks |
| `cables` | Cables & Accessories |
| `wireless` | Wireless Charging |
| `sale` | Sale |

## Discount Code

Use **CHARGE10** for 10% off (add coupon logic in Shopify Discounts).
