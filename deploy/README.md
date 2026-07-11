# Deploy en la Raspberry Pi

La Pi es el runner primario del scraping y del publish de datos. GitHub Pages
sigue sirviendo el sitio estático desde `docs/` en la rama `caudales`; el
workflow de Actions queda solo como fallback manual (`workflow_dispatch`).

## Topología

Un único clon en `/home/danitinez/dm/personal/aic-caudales`, compartido entre
desarrollo y automatización. El push usa la clave SSH ya configurada de la Pi
(`~/.ssh/id_ssh_github_pi`, remote `origin` en SSH).

Como el clon es compartido, `scripts/run_publish_on_pi.sh` es deliberadamente
conservador: si el repo quedó parado en otra rama, o `git pull --ff-only` no
puede avanzar (commits locales sin pushear, divergencia), la corrida falla y
queda visible en `journalctl` en lugar de tocar el árbol de trabajo.

## Setup one-time

### 1. Locale (imprescindible: el scraper parsea fechas en castellano)

```bash
sudo sed -i 's/^# *es_ES.UTF-8/es_ES.UTF-8/' /etc/locale.gen
sudo locale-gen
locale -a | grep -i es_ES   # debe listar es_ES.utf8
```

### 2. Notificaciones por Telegram (opcional)

`scripts/run_publish_on_pi.sh` avisa por Telegram cuando el publish falla y
manda un resumen cuando publica OK (ver `scripts/notify_telegram.sh`). Sin
configurar, no-opea en silencio.

```bash
cp deploy/.env.example deploy/.env
$EDITOR deploy/.env   # completar TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID
```

`deploy/.env` no se commitea (cubierto por el `.env` de `.gitignore`). Para
probar el envío a mano:

```bash
source scripts/notify_telegram.sh
set -a && source deploy/.env && set +a
notify_telegram "test desde la Pi"
```

### 3. Unidades systemd

```bash
sudo cp deploy/systemd/aic-caudales.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now aic-caudales.timer
```

## Operación

```bash
sudo systemctl start aic-caudales.service   # corrida manual
systemctl list-timers aic-caudales.timer    # próxima ejecución
journalctl -u aic-caudales.service -e       # logs de la última corrida
```

Verificación post-corrida en producción (deben responder 200 y con fecha
fresca): `index.html`, `latest.json`, `lakes.json`, `weather.json`,
`min_max_levels.json` bajo https://caudalguru.com.ar/.

Si se cambian las unidades en `deploy/systemd/`, repetir el paso 2 del setup
para reinstalarlas.

## Fallback de emergencia

Si la Pi está caída, el workflow `Python Application` se puede disparar a mano
desde la pestaña Actions de GitHub (`workflow_dispatch`). Corre exactamente el
mismo pipeline de datos.

## Frontend

El build del frontend queda **fuera** de la rutina de datos. Cuando cambia la
UI: `cd front && npm run build`, y copiar el dist a `docs/` sin pisar los JSON
de datos:

```bash
rsync -a --exclude='*.json' front/dist/ docs/
```

(el `--exclude='*.json'` protege los datos publicados: el dist trae un
`weather.json` de desarrollo horneado).
