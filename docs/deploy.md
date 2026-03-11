# Deploy

## Preflight

Перед деплоем проверить:

- `index.html`, `love/index.html`, `schastye/index.html`, `radost/index.html`
- `mobile/versions/v1/*`
- `mobile/versions/v2/index.html`
- `_worker.js`
- `robots.txt`
- `sitemap.xml`

Отдельно для главной проверить, что `_worker.js` ведёт desktop `/` на `index.html`, а mobile `/` на `mobile/versions/v2/index.html`.

Если корень снова разрастается тяжёлыми файлами, деплой делать не из всей директории, а из include-only staging bundle.

## Recommended Staging Bundle

В staging включать только:

- `assets/`
- `love/`
- `schastye/`
- `radost/`
- `mobile/`
- `index.html`
- `_worker.js`
- `_headers`
- `robots.txt`
- `sitemap.xml`
- `styles.css`
- `script.js`

## Example Deploy Command

```bash
wrangler pages deploy /path/to/staging \
  --project-name <pages-project> \
  --branch main \
  --commit-dirty=true
```

## Post-Deploy Smoke Checks

### Desktop

```bash
curl -Ls -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' https://lord-event.ru/ | rg '<title>'
```

### Mobile

```bash
curl -Ls -A 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1' https://lord-event.ru/ | rg '<title>'
```

### Inner Pages

Проверить `200 OK` для:

- `/love/`
- `/schastye/`
- `/radost/`

### API

Проверить:

- `POST /api/lead`
- `POST /api/rum`

## Local Mobile Preview

```bash
python3 -m http.server --bind 127.0.0.1 8000
```

После этого открыть:

- `http://127.0.0.1:8000/output/mobile-preview.html`
