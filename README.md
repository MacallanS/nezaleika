# Незалейка

PWA для полива комнатных растений: справочник видов с сезонными интервалами, фото, TikTok-лента «что полить», виджет-карточка и Web Push.

## Структура

- `api/` — Django + DRF + админка
- `web/` — Nuxt 3 PWA (UI на [bibli](../bibli))

## Быстрый старт (локально)

### API

```bash
cd api
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy ..\.env.example ..\.env
python manage.py migrate
python manage.py import_species_csv
python manage.py createsuperuser
python manage.py print_vapid_keys   # скопируйте ключи в .env
python manage.py runserver 127.0.0.1:8000
```

Пользователи для приложения **только из админки**: `/admin/` → Users → Add (без публичной регистрации).

### Web

```bash
cd web
npm install
npm run dev
```

Откройте http://127.0.0.1:3000 — API проксируется на `:8000`.

## PWA и push на iPhone

1. Откройте сайт в Safari.
2. «Поделиться» → **На экран «Домой»**.
3. Войдите в аккаунт → **Профиль** → «Подключить push».
4. Разрешите уведомления (iOS 16.4+, только установленное PWA).

Утренние напоминания: cron `notifications.cron.send_scheduled_push` (каждые 15 мин, окно в час `remind_time` в профиле). Локально: `python manage.py crontab add` и `python manage.py crontab run`.

## Docker

```bash
cp .env.example .env
docker compose up --build
```

Postgres на порту **5433**, API на **8000**.

## Smoke-сценарий

1. Создать user в админке, войти в PWA.
2. **Мои** → добавить цветок (вид из базы + фото).
3. **Полив** — виджет и вертикальная лента, нажать «Полил».
4. Открыть карточку растения — график и полив задним числом.
5. **Профиль** — тестовое push (при настроенных VAPID и подписке).

## Справочник растений

~300 видов в `api/plants/fixtures/species_large.csv` (flowering расширен). Обновление: `python scripts/expand_species_csv.py` → `python manage.py import_species_csv`. Фото видов: `python scripts/fetch_species_images.py --category flowering`.
