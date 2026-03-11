# Аудит директории `/Users/mir/Documents/codex/Сайты`

> Исторический снимок до чистки production-root. Актуальную карту после выноса архивов и transient-артефактов см. в `README.md` и `docs/project-map.md`.

Дата аудита: 2026-03-11

## Короткий вывод

В каталоге смешаны четыре разные зоны:

1. Боевой сайт LORD.
2. Версионируемая mobile-сборка.
3. Временные результаты работы, логи и рендеры.
4. Сторонние зеркала и архивные копии, не связанные с текущим продом.

Главная структурная проблема: корень директории одновременно используется как production-root, склад ассетов, архив, песочница и место для browser-логов. Из-за этого сложно понять, что реально участвует в проде, а что можно удалить.

## Что где находится

### Боевой сайт LORD

- `index.html`
  Главная desktop/Tilda-страница LORD.
- `love/index.html`
  Desktop-страница направления «Любовь».
- `schastye/index.html`
  Desktop-страница направления «Счастье».
- `radost/index.html`
  Desktop-страница направления «Радость».
- `assets/`
  Все рабочие ассеты и общие статические ресурсы сайта.
- `styles.css`
  Общий CSS для `/love`.
- `script.js`
  Общий JS корня.
- `_headers`
  Заголовки для статики.
- `robots.txt`, `sitemap.xml`
  SEO-файлы.

### Edge/runtime-логика

- `_worker.js`
  Cloudflare Worker для:
  - canonical redirect на `https://lord-event.ru`;
  - mobile/desktop HTML variant routing;
  - API `/api/lead`;
  - API `/api/rum`.
- `scripts/telegram_connect.py`
  Вспомогательный Python-скрипт для проверки Telegram-подключения.
- `requirements-telegram.txt`
  Python-зависимости только для этого скрипта.

### Mobile-сборка

- `mobile/versions/v1/`
  Текущий мобильный релиз:
  - `mobile/versions/v1/index.html`
  - `mobile/versions/v1/love/index.html`
  - `mobile/versions/v1/schastye/index.html`
  - `mobile/versions/v1/radost/index.html`
- `mobile/README.md`
  Правило выпуска новых mobile-релизов.

### Рабочие ассеты

- `assets/css/`
  CSS-слой проекта:
  - `lord-main-v26.css` для главной desktop;
  - `lord-overrides.css` для hotfix/Tilda override;
  - `lord-rebuild-v1.css` для mobile rebuild;
  - `site.css` для `/schastye` и `/radost`;
  - `gold-standard.css`, `header-main-clone.css` как дополнительные слои.
- `assets/js/`
  JS-слой проекта:
  - `lord-main-v26.js` для главной desktop;
  - `lord-rebuild-v1.js` для mobile rebuild;
  - `site.js` для внутренних страниц и форм;
  - дополнительные legacy/helper-файлы.
- `assets/lord/`
  Главные брендовые ассеты LORD, в том числе hero, favicon, loader-video.
- `assets/love/`, `assets/schastye/`, `assets/radost/`
  JPEG/PNG и другие материалы по направлениям.
- `assets/*-webp/`
  Отдельные webp-наборы для ускорения загрузки.
- `assets/clouds/`, `assets/flowers/`
  Декоративные ресурсы.

### Временные и служебные каталоги

- `.playwright-cli/` (около 10M, 194 файла)
  Логи, yaml и screenshots автоматизации браузера.
- `output/playwright/` (около 33M, 109 файлов)
  Выгрузки визуальных прогонов.
- `tmp/` (около 23M)
  Черновые картинки, html-снимки, промпты, тестовые изображения, session-файл Telegram.
- `.playwright/`
  CLI-конфиги Playwright.
- `.wrangler/`
  Кэш/служебные данные Cloudflare.
- `node_modules/`
  Сейчас не настоящий проектный `node_modules`, а служебный хвост (`.cache/wrangler`, `.mf/cf.json`).

### Сторонние и архивные каталоги

- `chipsa-mirror/` (около 1.3G)
  Большое зеркало внешнего сайта `chipsa.*`.
- `chipsa-mirror.zip` (около 108M)
  Архив того же зеркала.
- `Евгении Whiteside/` (около 113M)
  Отдельный набор зеркальных/экспортных данных, не связанный с текущим LORD runtime.
- `Сайт Ивент — копия/` (около 13M)
  Старая копия сайта/ассетов.

## Что реально участвует в текущем проде

Высокая вероятность участия в проде:

- `index.html`
- `love/index.html`
- `schastye/index.html`
- `radost/index.html`
- `assets/`
- `_worker.js`
- `_headers`
- `styles.css`
- `script.js`
- `robots.txt`
- `sitemap.xml`
- `mobile/versions/v1/`

Низкая вероятность участия в проде:

- `.playwright-cli/`
- `output/`
- `tmp/`
- `.wrangler/`
- `node_modules/`
- `chipsa-mirror/`
- `chipsa-mirror.zip`
- `Евгении Whiteside/`
- `Сайт Ивент — копия/`

## Основные находки ревью

1. Корень репозитория перегружен артефактами.
   Production-файлы лежат рядом с зеркалами на гигабайты, временными рендерами и отладочными логами.

2. До правки mobile routing был без явной версии релиза.
   Mobile HTML лежал прямо в `mobile/*`, из-за чего следующий релиз пришлось бы выкатывать поверх текущего состояния. Это уже исправлено: current release вынесен в `mobile/versions/v1/`, а worker переключается через константу релиза.

3. Git-гигиена была недостаточной.
   В корень постоянно оседают `.DS_Store`, Playwright-логи, `tmp`, служебные кэши Wrangler и подобные артефакты.

4. В проекте нет полноценного манифеста окружения.
   Не найдено `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `wrangler.toml`, `pyproject.toml`. Это не ломает статический деплой, но ухудшает воспроизводимость и затрудняет перенос среды.

5. В `assets/lord/` накоплены старые генерации hero-ассетов.
   По текстовому поиску не используются:
   - `assets/lord/hero-first-block-bg-2acd-8k.jpg`
   - `assets/lord/hero-first-block-bg-2acd-8k.webp`
   - `assets/lord/hero-first-block-bg-2acd-source.png`
   - `assets/lord/hero-first-block-bg-8k.jpg`
   - `assets/lord/hero-first-block-bg-8k.webp`
   - `assets/lord/hero-first-block-bg.jpg`
   - `assets/lord/hero-first-block-bg-final-source.png`
   - `assets/lord/hero-main-final-source.png`

   Перед удалением всё равно нужен быстрый финальный grep по бинарным/templated pipeline, но это хорошие кандидаты на чистку.

## Что можно удалить или очистить

### Удалить сейчас почти без риска

- `.DS_Store`
- `assets/.DS_Store`
- `.playwright-cli/`
- `output/playwright/`
- `.wrangler/cache/`
- `.wrangler/state/`
- `.wrangler/tmp/`
- содержимое `tmp/`, если текущие черновики больше не нужны

### Вынести из корня в архивную зону

Если эти материалы нужны только как референсы, лучше переместить за пределы production-root, например в `../archive/` или внешний диск:

- `chipsa-mirror/`
- `chipsa-mirror.zip`
- `Евгении Whiteside/`
- `Сайт Ивент — копия/`

Причина: эти каталоги не должны лежать рядом с продом. Они шумят в поиске, мешают ревью и раздувают резервные копии.

### Проверить и затем удалить точечно

- старые hero/source-файлы в `assets/lord/`
- устаревшие preview-файлы в `output/`
- промежуточные html-снимки в `tmp/`

## Рекомендуемая целевая структура

```text
Сайты/
  assets/
  docs/
  mobile/
    README.md
    versions/
      v1/
  scripts/
  love/
  schastye/
  radost/
  index.html
  _worker.js
  _headers
  styles.css
  script.js
  robots.txt
  sitemap.xml
```

Отдельно, вне production-root:

```text
archive/
  chipsa-mirror/
  chipsa-mirror.zip
  Евгении Whiteside/
  Сайт Ивент — копия/
```

И отдельно для временных прогонов:

```text
workspace-output/
  playwright/
  tmp/
```

## Правило по mobile-versioning

Текущий рабочий контракт:

- mobile HTML хранится в `mobile/versions/<release>/...`
- текущий release задаётся в `_worker.js` константой `MOBILE_RELEASE`
- публичные URL не меняются
- прямой доступ к `/mobile/...` скрыт редиректом на canonical public routes

Это даёт три преимущества:

1. Новый mobile-релиз можно собрать рядом с текущим, не ломая прод.
2. Rollback сводится к переключению одной константы.
3. История мобильных релизов перестаёт жить «вперемешку» с корнем проекта.

## Что рекомендую сделать следующим шагом

1. Физически вынести зеркала и старые копии из корня.
2. Очистить `.playwright-cli/`, `output/playwright/` и `tmp/`.
3. Прорезать старые ассеты в `assets/lord/` после финального подтверждения ссылок.
4. Добавить минимальный runtime-манифест деплоя, если проект продолжит жить как инженерный репозиторий, а не только как папка со статикой.
