# Data Contract

`bilder-metadaten.json` is the canonical dataset for works shown in both the homepage carousel and the standalone gallery page.

## Required fields

Each entry should provide at least:

- `file`
  Filename used as the stable asset identifier.
- `path`
  Relative path to the image asset.
- `category`
  Internal category slug used by filters.
- `category_de`
  German category label.
- `category_en`
  English category label.
- `title_de`
  German title.
- `title_en`
  English title, when available.
- `year`
  Numeric or string year.

## Optional fields

- `technique_de`
- `technique_en`
- `dimensions`
- `owner`

## Path rules

- Keep paths repository-relative.
- Do not point entries at remote URLs unless the runtime is intentionally changed to support them.
- The `file` field should stay stable even if titles change.

## Update workflow

1. Add or update the image asset under `assets/bilder/...`.
2. Update the matching JSON entry.
3. Load both `index.html` and `gallery.html` locally.
4. Confirm that the work renders in the gallery, opens in the detail overlay, and still filters correctly.

## Notes

- The homepage carousel selects a curated subset from the full dataset.
- The detail overlay expects missing optional fields to degrade gracefully, but required fields should not be omitted.
- If the dataset shape changes, update `js/home-carousel.js`, `js/gallery.js`, and this document together.
