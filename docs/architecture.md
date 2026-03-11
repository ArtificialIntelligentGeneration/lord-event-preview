# Architecture

## Public Routes

Worker в `_worker.js` обслуживает четыре canonical routes:

- `/`
- `/love/`
- `/schastye/`
- `/radost/`

Для каждой route есть desktop и mobile variant.

## Variant Routing

Worker определяет variant так:

1. `?view=mobile|desktop`
2. `Sec-CH-UA-Mobile`
3. `User-Agent`

Для HTML worker ставит:

- `Vary: User-Agent, Sec-CH-UA-Mobile`
- `Cache-Control: no-store`

Прямой доступ к `/mobile/...` скрыт: такие URL редиректятся обратно на canonical routes.

## Current Source Files

### Desktop

- `/index.html`
- `/love/index.html`
- `/schastye/index.html`
- `/radost/index.html`

### Mobile

- `/mobile/versions/v1/love/index.html`
- `/mobile/versions/v1/schastye/index.html`
- `/mobile/versions/v1/radost/index.html`
- `/mobile/versions/v2/index.html`

## Shared Assets

- `assets/css/lord-main-v26.css` + `assets/js/lord-main-v26.js` — desktop main page
- `assets/css/lord-rebuild-v1.css` + `assets/js/lord-rebuild-v1.js` — mobile release
- `assets/css/lord-rebuild-v2.css` + `assets/js/lord-rebuild-v2.js` — mobile root release
- `assets/css/site.css` + `assets/js/site.js` — inner pages
- `styles.css` — Love page layer

## APIs

- `/api/lead` — lead form submission
- `/api/rum` — simple runtime logging endpoint

## Homepage Source Of Truth

Для корня `/` рабочее дерево снова использует split по продукту:

- desktop `/` в worker -> `index.html`
- mobile `/` в worker -> `mobile/versions/v2/index.html`

Это целевой компромисс текущей итерации: desktop-эталон остаётся source of truth для бренда и структуры, а mobile root живёт отдельной адаптацией этого же контента.

Внутренние mobile routes пока остаются на `mobile/versions/v1/*`, а `mobile/versions/v1/index.html` сохранён как backup старой mobile-главной.
