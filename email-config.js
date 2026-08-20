/* =========================================================================
   ENVIO DE DOCUMENTACION AL PACIENTE — CONFIGURACION
   -------------------------------------------------------------------------
   La app no manda mails por si sola: los navegadores no pueden. Le pide a un
   pequeño programa alojado en Google Apps Script que lo haga, y ese programa
   envia desde una cuenta de Google real de la asociacion.

   COMO COMPLETAR ESTO (una sola vez, lo hace el coordinador)
   Ver el instructivo paso a paso en  ENVIO-DE-MAILS.md

   1. Entrar a  script.google.com  con la cuenta de Google de la asociacion
   2. Proyecto nuevo, pegar el contenido de  apps-script/Codigo.gs
   3. Cambiar CLAVE_COMPARTIDA en ese archivo por una frase larga propia
   4. Implementar -> Nueva implementacion -> Aplicacion web
        Ejecutar como:      Yo
        Quien tiene acceso: Cualquier persona
   5. Copiar la URL que termina en /exec y pegarla abajo en ENVIO_URL
   6. Pegar abajo la MISMA frase del paso 3 en ENVIO_CLAVE
   7. Reconstruir con  python3 build.py  y subir el index.html

   SI SE DEJA VACIO
   La app funciona igual que siempre; el boton de enviar por mail avisa que
   todavia no esta configurado y no se rompe nada.

   ADVERTENCIA DE SEGURIDAD — LEER
   Estos dos valores viajan dentro del index.html, que es publico. Cualquiera
   que lea el codigo puede encontrarlos y usar el envio para mandar mails
   desde la cuenta de la asociacion. El programa de Apps Script se defiende
   con un tope diario y un registro de todo lo que envia, pero eso limita el
   daño, no lo impide. La proteccion de verdad es que la app se identifique
   contra un servicio de autenticacion, que es el mismo trabajo pendiente que
   el de las reglas de la base de datos.

   Si algun dia se sospecha un uso indebido: cambiar la frase de CLAVE_COMPARTIDA
   en Apps Script y aca, reconstruir y volver a subir. Con eso queda cortado.
   ========================================================================= */
'use strict';

const ENVIO_URL   = 'https://script.google.com/macros/s/AKfycbwq7Qc6cC1-qTQvkQovqUiw_ds3QZdTo-VqhRnQfjZ-1Qky8V0RG7c2ZcJsKlDjSkOb/exec';
const ENVIO_CLAVE = 'AFAAR-CONTACTO-PACIENTES-x7kq93m4';

/* Direccion que el paciente ve como remitente. Se completa sola con la cuenta
   de Google que ejecuta el Apps Script; esto es solo el nombre visible. */
const ENVIO_NOMBRE = 'AFAAR — Asociación Fueguina de Analgesia, Anestesia y Reanimación';
