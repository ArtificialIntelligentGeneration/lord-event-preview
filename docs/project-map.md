# Project Map

Дата актуализации: 2026-03-11

## Active Production Root

```text
Сайты/
  assets/                  рабочие ассеты и shared css/js
  docs/                    документация по структуре и процессу
  love/                    desktop page: Любовь
  mobile/
    README.md              правило выпуска mobile releases
    versions/
      v1/                  mobile inner pages + backup старой mobile-главной
      v2/                  mobile root release для `/`
  output/
    mobile-preview.html    локальный mobile preview helper
  radost/                  desktop page: Радость
  schastye/                desktop page: Счастье
  scripts/
    telegram_connect.py    служебная проверка Telegram-соединения
  tmp/
    telegram-user.session  локальная session для MTProto-скрипта
  _headers                 static headers
  _worker.js               Pages Worker: variant routing + APIs
  context.md               краткая проектная память
  index.html               текущая desktop-главная
  memory-journal.md        append-only журнал решений
  README.md                входная точка по проекту
  robots.txt               SEO
  sitemap.xml              SEO
  script.js                shared root js
  styles.css               shared styles для Love
```

## Outside Root Archive

Внешний архив находится здесь:

- `/Users/mir/Documents/codex/_project-archive-20260311`

Туда уже вынесены:

- внешние зеркала и старые копии сайтов;
- `.playwright-cli/` и `output/playwright/`;
- `output/imagegen/`, `output/schastye-next/`, contactsheets;
- большая часть `tmp/`-черновиков и reference-материалов.

## Homepage Contract

Текущий контракт корня:

- desktop `/` в worker ведёт на `index.html`;
- mobile `/` в worker ведёт на `mobile/versions/v2/index.html`;
- mobile `/love/`, `/schastye/`, `/radost/` пока ведут на `mobile/versions/v1/*`;
- `mobile/versions/v1/index.html` сохранён как backup и не участвует в active routing.
