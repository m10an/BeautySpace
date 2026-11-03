# Ручное создание PR при GitHub 403

В этой сессии попытка создать `test/playwright-e2e` через аккаунт `happymarysan-dot` получила `403 Resource not accessible by integration`. Удалённая ветка и PR не созданы. Это ограничение GitHub-интеграции; предоставленная ранее информация о правах аккаунта не гарантирует права токена приложения.

Подготовлена локальная ветка с тем же именем от commit `8437a9eae0f5892fdba22808b2b4326fff355d6e`. В архиве изменений есть `changes.patch` и полные версии добавляемых/изменяемых файлов. Production-файлы в патч не включены.

## Через локальный Git

Скачайте и распакуйте архив изменений. В своей копии репозитория:

```bash
git fetch origin
git switch -c test/playwright-e2e origin/main
git apply --check /path/to/changes.patch
git apply /path/to/changes.patch
npm ci
npx playwright install --with-deps chromium
npm run test:unit
npm run test:e2e
npm run test:audit
```

Если ветка уже есть, вместо `git switch -c ...` используйте `git switch test/playwright-e2e`. При ошибке `git apply --check` не применяйте патч принудительно: проверьте различия с актуальным `main`, особенно `.github/workflows/ci.yml`.

`test:audit` ожидаемо сообщает существующие дефекты. Список и результаты — `docs/QA-RESULTS.md`. После просмотра изменений:

```bash
git add .github/workflows/ci.yml .gitignore package.json package-lock.json playwright.config.cjs tests docs
git diff --cached --check
git diff --cached --stat
git commit -m "test: add Chromium QA suite and CI reports"
git push -u origin test/playwright-e2e
```

Откройте https://github.com/happymarysan-dot/Beautycalendar/compare/main...test/playwright-e2e и создайте Pull Request. Не выполняйте merge. Деплой в этих изменениях не настроен.

## Через веб-интерфейс GitHub

1. Создайте ветку `test/playwright-e2e` от `main` через переключатель веток.
2. Выберите эту ветку перед добавлением файлов.
3. Из папки `files/` архива добавьте файлы с сохранением всех путей; `.github/workflows/ci.yml` замените полным содержимым из архива. Не загружайте сам ZIP, `changes.patch`, `node_modules`, отчёты или `.git` в исходники.
4. Проверьте diff и создайте PR в `main` через **Compare & pull request**.

При работе через web зависимости и browser-тесты установит CI. Отчёты доступны в **Actions → выбранный запуск → Artifacts**. Диагностический audit пока неблокирующий, что явно указано в имени job и YAML.

## Предлагаемый текст PR

**Title:** `test: add Chromium QA suite and CI reports`

**Body:**

Добавлены unit-тесты существующего процента flagged/recognized, Chromium E2E для четырёх разрешений, проверки сохранения localStorage/IndexedDB, геометрический и axe WCAG 2.2 AA аудит. Матрица требований, фактическая формула и ограничения описаны в docs/QA.md; результаты и известные дефекты — в docs/QA-RESULTS.md.

CI запускает стабильные regression-тесты как обязательный job, известные UI-дефекты показывает в отдельном неблокирующем audit job и сохраняет скриншоты, trace, video и отчёты. Screenshot baselines не обновляются автоматически; при отсутствии утверждённых PNG сравнения явно пропускаются.

Код приложения, формула, бизнес-логика и пользовательские данные не изменялись. Merge и деплой не выполнялись. Проверки проведены на исходном commit 8437a9eae0f5892fdba22808b2b4326fff355d6e; после применения на обновлённый main нужно повторить CI.
