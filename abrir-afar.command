#!/bin/bash
# Doble clic para levantar AFAR en el navegador.
cd "$(dirname "$0")"
PUERTO=8777
echo "AFAAR"
echo "Servidor en http://127.0.0.1:$PUERTO"
echo "Para verla desde el celular en la misma red:"
ipconfig getifaddr en0 2>/dev/null | sed "s|^|  http://|;s|$|:$PUERTO|"
ipconfig getifaddr en1 2>/dev/null | sed "s|^|  http://|;s|$|:$PUERTO|"
echo ""
echo "Cerrá esta ventana o apretá Ctrl+C para detenerlo."
sleep 1
open "http://127.0.0.1:$PUERTO/index.html"
python3 -m http.server $PUERTO
