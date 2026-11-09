# Как деплоить «Незалейка» (только бесплатно)

Всё ниже рассчитано на **бесплатный** стек: публичный GitHub Pages + бесплатный/trial хост API.  
Платные GitHub Actions **не нужны** — PWA выкладываем вручную на ветку `gh-pages`.

## Ссылки

| Что | URL |
|---|---|
| Сайт (PWA) | https://macallans.github.io/nezaleika/ |
| API | https://nezaleika.up.railway.app |
| Health API | https://nezaleika.up.railway.app/api/csrf/ |
| Tick напоминаний | https://nezaleika.up.railway.app/api/push/tick |
| Репозиторий | https://github.com/MacallanS/nezaleika |
| Pages (ветка gh-pages) | https://github.com/MacallanS/nezaleika/settings/pages |
| Railway (бесплатный trial/кредиты) | https://railway.com/dashboard |

GitHub Variable (если когда‑нибудь снова включите Actions):  
`NEZALEIKA_API_URL` = `https://nezaleika.up.railway.app`

```text
Phone PWA → GitHub Pages (ветка gh-pages, бесплатно)
                ↓
         Railway API (free/trial) → Postgres
                ↑
     start.sh loop каждые 15 мин (+ /api/push/tick)
     без GitHub Actions cron
```

## Бесплатные правила

1. **PWA** — только ветка `gh-pages` (GitHub Pages для public repo = $0). Не включать workflow Deploy, пока Billing locked.
2. **API** — Railway на free/trial credits; не поднимать платные add-on’ы. Альтернатива free: Render free (засыпает).
3. **Напоминания** — loop в `api/start.sh` + `/api/push/tick` на том же бесплатном API-сервисе. Не использовать платные Actions cron.
4. Репозиторий **public** — иначе Pages может требовать pro.

## 1. API (бесплатный хост)

Пуш в `main` (Railway сам соберёт, если подключён GitHub):

```powershell
git push origin main
```

1. [Railway Dashboard](https://railway.com/dashboard) → сервис → дождись Deploy (или **Redeploy**).
2. Проверка: https://nezaleika.up.railway.app/api/csrf/
3. Tick: https://nezaleika.up.railway.app/api/push/tick

Variables (минимум):

- `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
- `SECRET_KEY`
- `DEBUG` = `0`
- `CORS_ALLOWED_ORIGINS` = `https://macallans.github.io`
- `PUBLIC_BASE_URL` = `https://macallans.github.io/nezaleika`
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CLAIMS_EMAIL`

Root Dockerfile в корне репо → `api/start.sh` (там бесплатный 15‑мин loop для пушей).

## 2. PWA — бесплатный ручной деплой

Pages Source: **Deploy from a branch** → `gh-pages` / `/`  
(не GitHub Actions).

```powershell
cd d:\RussM\nezaleika
.\scripts\deploy-pages.ps1
```

Или то же руками — см. скрипт [`scripts/deploy-pages.ps1`](scripts/deploy-pages.ps1).

Сайт: https://macallans.github.io/nezaleika/

## 3. Напоминания (бесплатно)

1. Профиль → время (например 13:00) → сохранить.
2. Подключить push + «Проверить уведомление».
3. Loop на Railway шлёт после `remind_time`.
4. Ручной пинок: https://nezaleika.up.railway.app/api/push/tick

## 4. iPhone

1. Safari → https://macallans.github.io/nezaleika/
2. Поделиться → **На экран «Домой»**.
3. Профиль → push (iOS 16.4+, только из PWA).

## Если снова захотите Actions (тоже free для public, но сейчас locked)

1. Закрыть billing lock: https://github.com/settings/billing  
2. Включить только **Deploy PWA** (без keep-alive/cron — они жрут минуты зря).  
3. Cron по-прежнему лучше оставить в `start.sh` на API.

## Не делать

- Не включать платные Railway/Render планы «на всякий случай».
- Не гонять schedule workflows каждые 12–15 мин — это и сожгло Actions.
- Не деплоить API на платный always-on, пока хватает free/trial.
