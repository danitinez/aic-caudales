#!/usr/bin/env bash
# Corrida completa de scraping + publish de datos, pensada para el timer
# systemd de la Raspberry Pi (ver deploy/systemd/). Reemplaza al schedule de
# GitHub Actions como camino primario de datos.
#
# Semántica de fallos (misma que tenía el workflow de CI):
#   - scraper_app.py falla        -> aborta toda la corrida (nada se publica)
#   - lakes/weather fallan        -> se loguea y la corrida sigue; los propios
#                                    scripts se niegan a escribir scrapes
#                                    parciales, así que el alias viejo sobrevive
#   - compute_ranges.py corre solo si scraper_app.py terminó bien (set -e)
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

# shellcheck source=notify_telegram.sh
source "$REPO_DIR/scripts/notify_telegram.sh"
if [ -f "$REPO_DIR/deploy/.env" ]; then
    set -a
    # shellcheck source=/dev/null
    source "$REPO_DIR/deploy/.env"
    set +a
fi
# Cubre cualquier comando que falle bajo set -e (git pull, scraper, push...).
# El chequeo de branch de abajo usa `exit` explícito, que no dispara ERR, así
# que notifica a mano antes de salir.
trap 'notify_telegram "❌ aic-caudales: falló el publish en la Pi (línea ${LINENO})
Comando: ${BASH_COMMAND}
Logs: journalctl -u aic-caudales.service -e"' ERR

# DataGatherer parsea fechas en castellano ("viernes, 11 de julio de 2026").
export LC_ALL=es_ES.UTF-8 LANG=es_ES.UTF-8

BRANCH=caudales

echo "==> Sync del repo (${BRANCH})"
# Este clon se comparte con el desarrollo: si quedó parado en otra rama,
# preferimos fallar (visible en journalctl) antes que cambiarla por debajo.
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "$BRANCH" ]; then
    echo "ERROR: el repo está en '$current_branch', se esperaba '$BRANCH'; no se corre el publish." >&2
    notify_telegram "❌ aic-caudales: el repo en la Pi está en '$current_branch', se esperaba '$BRANCH'; no se corrió el publish."
    exit 1
fi
git fetch origin
# --ff-only: si hay commits locales sin pushear o divergencia, preferimos
# fallar acá (y verlo en journalctl) antes que pisar o mergear a ciegas.
git pull --ff-only origin "$BRANCH"

echo "==> Entorno Python"
if [ ! -d .venv ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install --quiet -r requirements.txt

echo "==> Scraper de caudales"
python scraper_app.py

echo "==> Rangos históricos (min_max_levels.json)"
python compute_ranges.py --write

echo "==> Scraper de embalses"
python lakes_scraper.py || echo "WARN: lakes_scraper.py falló; se conserva el lakes.json anterior" >&2

echo "==> Scraper de clima"
python weather_scraper.py || echo "WARN: weather_scraper.py falló; se conserva el weather.json anterior" >&2

echo "==> Publish"
# --porcelain incluye archivos nuevos sin trackear (los JSON fechados del día),
# que `git diff` no vería.
changed_files="$(git status --porcelain -- docs/)"
if [ -z "$changed_files" ]; then
    echo "Sin cambios en docs/; no hay nada que publicar."
    exit 0
fi

git add docs/
git commit -m "Actualizando caudales: $(LC_ALL=C date -u)"
git push origin "$BRANCH"
echo "==> Publicado OK"

notify_telegram "✅ aic-caudales publicado ($(LC_ALL=C date -u '+%Y-%m-%d %H:%M UTC'))
$(echo "$changed_files" | awk '{print "• "$2}')"
