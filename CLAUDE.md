# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This App Is

**OV Suspensión** — a B2B product search and quotation tool for automotive suspension/steering parts. Users search across two supplier APIs (RM and ASM), add products to a cart, and print price quotes.

## Running Locally

No build step. Serve static files with any HTTP server:

```bash
python3 -m http.server 8000
```

Requires both backend APIs running:
- RM backend at `http://localhost:3001`
- ASM backend at `http://localhost:3000`

## Architecture

Vanilla JavaScript SPA — no framework, no bundler, no npm. Direct DOM manipulation throughout.

### Entry Points

| File | Purpose |
|---|---|
| `index.html` + `app.js` | RM product search (main catalog) |
| `catalogo-asm.html` + `catalogo-asm.js` | ASM product search |
| `marcas.html` + `marcas.js` | Brand CRUD (list/create/edit) |

### Data Flow

1. User submits search form → POST to `/scraper/productos` (RM) or `/search` (ASM)
2. Response products are normalized to a common shape, stored in module-level arrays
3. `renderPage()` renders paginated table (25 rows/page, client-side pagination)
4. Clicking a row opens a product detail modal
5. "Agregar al presupuesto" calls `addToCart()` → writes to `cart` object → persists to `localStorage` key `ov_presupuesto`
6. Cart drawer re-renders via `updateCartUI()`

### Two API Sources

Both sources normalize to a common product shape before cart/modal use:

- **RM** (`/scraper/productos`): fields `codigo`, `nombre`, `marca`, `rubro`, `precio`, `costo`, `precioSugerido`. Cart key prefix: `rm:`
- **ASM** (`/search`): fields `code`, `name`, `vehicle`, `brand`, `precioIva`, `precioCosto`, `precioVenta`, `stock`, `category`. Cart key prefix: `asm:`

### Hardcoded Data

Brands (57 marcas), rubros (104 rubros in RM), and categorias (41 in ASM) are embedded as JS arrays in the source files — they are **not** fetched from an API.

### State

- Cart persisted in `localStorage` (`ov_presupuesto`)
- Brand CRUD success messages passed between pages via `sessionStorage`
- Dark/light theme toggled via `data-theme` attribute on `<html>`

### Print Support

CSS uses `.print-only` / `.print-header` / `.print-footer` classes to compose the printable quote layout. `@media print` hides all interactive UI. The presupuesto print path is the primary output format for quotes.

### API Endpoints (backend contract)

```
POST /scraper/productos   { codigoAuto, marcaId, rubroId, cantidadRenglones } → { productos[], totalProductos }
POST /search              { query, filters?: { categoria } } → { products[] }
GET/POST/PUT/DELETE /marcas  (brand CRUD)
```
