# LORD Site Workspace

Этот каталог теперь рассматривается как active production root для сайта `lord-event.ru`.

## Что здесь живёт

- `index.html` — active desktop-эталон для корня `/`.
- `love/`, `schastye/`, `radost/` — внутренние страницы направлений.
- `mobile/versions/v1/` — текущий mobile release для внутренних страниц.
- `mobile/versions/v2/index.html` — отдельная mobile-главная для `/`.
- `assets/` — все рабочие статические ресурсы.
- `_worker.js` — routing, variant selection, `/api/lead`, `/api/rum`.
- `output/mobile-preview.html` — локальный helper для просмотра mobile release через `http.server`.
- `docs/` — актуальная документация по структуре, деплою и правилам хранения.

## Что уже вынесено из корня

Не-продовые зеркала, Playwright-артефакты, временные контакшиты и большая часть черновиков вынесены во внешний архив:

- `/Users/mir/Documents/codex/_project-archive-20260311`

Эта директория не участвует в runtime и не должна смешиваться с production-root.

## Homepage Status

В рабочем дереве корень снова разведен по исходному продукту:

- desktop `/` снова берет source of truth из `index.html`;
- mobile `/` теперь берет отдельную адаптацию desktop-главной из `mobile/versions/v2/index.html`;
- mobile `/love/`, `/schastye/`, `/radost/` временно остаются на `mobile/versions/v1/*`;
- `mobile/versions/v1/index.html` сохранен как hidden backup и больше не участвует в active root routing.

Чтобы это состояние применилось на публичном сайте, нужен деплой.

## Документация

- `docs/project-map.md` — быстрая карта директорий.
- `docs/architecture.md` — как устроены страницы, worker и variant routing.
- `docs/deploy.md` — как выкатывать и чем проверять релиз.
- `docs/archive-policy.md` — что можно держать в корне, а что нужно выносить.
- `docs/directory-audit-2026-03-11.md` — исторический аудит до чистки корня.
