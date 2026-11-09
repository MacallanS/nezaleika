#!/bin/sh
set -eu
python manage.py migrate --noinput
python manage.py import_species_csv
python manage.py collectstatic --noinput

# GitHub Actions cron is unreliable (billing / old host). Run reminders in-process.
(
  # Give gunicorn a moment to bind, then tick every 15 minutes.
  sleep 30
  while true; do
    python manage.py send_scheduled_push || true
    sleep 900
  done
) &

exec gunicorn config.wsgi:application --bind "0.0.0.0:${PORT:-8000}" --workers "${WEB_CONCURRENCY:-1}" --timeout 120
