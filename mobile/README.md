# Mobile Releases

Текущая мобильная версия сайта хранится не в корне `mobile/`, а в релизных подпапках:

- `mobile/versions/v1/love/index.html`
- `mobile/versions/v1/schastye/index.html`
- `mobile/versions/v1/radost/index.html`
- `mobile/versions/v2/index.html`

`v1/index.html` не удалён, но теперь хранится как hidden backup для старой lux-главной.

## Как это работает

- Публичные URL остаются прежними: `/`, `/love/`, `/schastye/`, `/radost/`.
- `_worker.js` определяет mobile/desktop по `view=*`, `Sec-CH-UA-Mobile` и `User-Agent`.
- Для mobile worker внутренне отдает HTML из `mobile/versions/<release>/...`, но для корня `/` может использовать отдельный release.
- Прямой доступ к `/mobile/...` остаётся скрытым: такие URL редиректятся на публичные canonical routes.

## Как выпустить новый mobile-релиз

1. Скопировать текущий релиз в новую папку, например `mobile/versions/v2/`.
2. Внести изменения только в новой версии.
3. Если меняется только корень `/`, переключить в `_worker.js` отдельный `MOBILE_ROOT_RELEASE`.
4. Если меняются внутренние страницы, переключить `MOBILE_RELEASE`.
5. Проверить маршруты `/`, `/love/`, `/schastye/`, `/radost/` с mobile и desktop UA.

## Правило

Не править старые release-папки после переключения продакшена. Для hotfix создавать новый релиз или осознанно фиксировать причину прямой правки в журнале памяти.
