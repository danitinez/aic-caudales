#!/usr/bin/env bash
# Notificaciones por Telegram para el pipeline de publish en la Pi (ver
# scripts/run_publish_on_pi.sh y deploy/.env.example). Pensado para ser
# `source`ado, no ejecutado directamente.

notify_telegram() {
    local message="$1"
    if [ -z "${TELEGRAM_BOT_TOKEN:-}" ] || [ -z "${TELEGRAM_CHAT_ID:-}" ]; then
        return 0
    fi
    # Título fijo para distinguir de otros proyectos que notifican al mismo chat.
    local text
    text=$'🌊 caudalguru.com.ar\n\n'"${message}"
    curl -s -m 10 \
        -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d "chat_id=${TELEGRAM_CHAT_ID}" \
        --data-urlencode "text=${text}" \
        > /dev/null || echo "WARN: no se pudo enviar la notificación de Telegram" >&2
}
