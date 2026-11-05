# Публикация «Незалейка» (MacallanS + GitHub Pages)

GitHub Pages отдаёт **только статику** (PWA). API Django живёт отдельно. С телефона: иконка на экране «Домой» + виджет-карточка **внутри приложения** (нативный виджет iOS на Home Screen для PWA недоступен).

## Переезд API на Railway

Сайт (PWA) остаётся на GitHub Pages. На Railway переезжает только API и база. Фото растений лежат в базе, в поле `photo_data`.

Дамп с текущего Render уже снят локально: `exports/household-live.json` (в git не коммитить, там фото).

1. Запушь эту ветку в `MacallanS/nezaleika` аккаунтом MacallanS.
2. Открой [Railway → New from GitHub](https://railway.com/new/github) и выбери репозиторий. Root Directory не меняй: в корне есть `Dockerfile`.
3. В том же проекте: **New → Database → PostgreSQL**.
4. У сервиса API в Variables:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (имя подставь своё, если база названа иначе)
   - `SECRET_KEY` — длинная случайная строка
   - `DEBUG` = `0`
   - `CORS_ALLOWED_ORIGINS` = `https://macallans.github.io`
   - `PUBLIC_BASE_URL` = `https://macallans.github.io/nezaleika`
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CLAIMS_EMAIL` — скопируй из Render, иначе пуши на телефоне отвалятся
5. **Settings → Networking → Generate Domain**. Дождись зелёного деплоя и открой `https://<домен>/api/csrf/`.
6. С компьютера, где лежит дамп, залей данные в Postgres Railway (публичный URL базы из вкладки Connect, в нём есть `sslmode=require`):

```powershell
cd api
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
$env:DATABASE_URL = "postgresql://...."
.\.venv\Scripts\python manage.py migrate
.\.venv\Scripts\python manage.py import_species_csv
.\.venv\Scripts\python manage.py import_household_export ..\exports\household-live.json
```

Логин в приложении тот же, что сейчас. Повторный запуск импорта не плодит дубликаты.
7. В GitHub: **Settings → Secrets and variables → Actions → Variables**: `NEZALEIKA_API_URL` = адрес Railway без слэша в конце. Потом заново запусти workflow **Deploy PWA to GitHub Pages**, чтобы приложение перестало ходить на Render.

Напоминания о поливе: отдельный сервис в том же проекте Railway, Cron `*/15 * * * *`, команда `python manage.py send_scheduled_push`, те же Variables. Подписки пушей с телефона в дамп не входят — после смены ключей VAPID их нужно включить заново в профиле.

## 1. API на Render (старый хост)

1. Залейте репозиторий на GitHub (`MacallanS/nezaleika`).
2. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** → подключите репо, примените `render.yaml`.
3. После деполя скопируйте URL API, например `https://nezaleika-api.onrender.com`.
4. В сервисе **Environment** задайте:
   - `CORS_ALLOWED_ORIGINS` = `https://macallans.github.io`
   - `PUBLIC_BASE_URL` = `https://macallans.github.io/MacallanS/nezaleika/` (или ваш путь Pages)
   - `ALLOWED_HOSTS` = `nezaleika-api.onrender.com`
   - `VAPID_*` — `python manage.py print_vapid_keys` локально
5. В Render **Shell**: `python manage.py createsuperuser` и создайте пользователей в `/admin/`.

## 2. GitHub Pages (PWA)

1. Репозиторий → **Settings** → **Pages** → Source: **GitHub Actions**.
2. **Settings** → **Secrets and variables** → **Actions** → **Variables**:
   - `NEZALEIKA_API_URL` = `https://nezaleika-api.onrender.com` (без слэша в конце)
3. Пуш в `main` запускает [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml).

Сайт: `https://macallans.github.io/<имя-репозитория>/`  
(для репо `nezaleika` → `https://macallans.github.io/nezaleika/`)

## 3. iPhone

1. Safari → откройте URL Pages.
2. **Поделиться** → **На экран «Домой»**.
3. Войдите (`demo` только если создали на сервере).
4. **Профиль** → подключить push (iOS 16.4+, только из установленного PWA).

## 4. Локальный пуш на GitHub (один раз)

```bash
cd d:\RussM\nezaleika
git init
git add .
git commit -m "Nezaleika PWA and API"
gh auth login
gh repo create MacallanS/nezaleika --public --source=. --remote=origin --push
```

Если репозиторий уже есть: `git remote add origin https://github.com/MacallanS/nezaleika.git` и `git push -u origin main`.

## Примечания

- Фото на Render на бесплатном тарифе могут пропасть после пересборки — для постоянного хранения позже подключите S3.
- Free Render «засыпает» — первый запрос с телефона может быть медленным.
