# Публикация «Незалейка» (MacallanS + GitHub Pages)

GitHub Pages отдаёт **только статику** (PWA). API Django нужно поднять отдельно (ниже — Render). С телефона: иконка на экране «Домой» + виджет-карточка **внутри приложения** (нативный виджет iOS на Home Screen для PWA недоступен).

## 1. API на Render

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
