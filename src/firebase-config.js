/* =========================================================================
   CONFIGURACION DE FIREBASE INCLUIDA EN LA APLICACION
   -------------------------------------------------------------------------
   Pegando acá los datos del proyecto, la app queda conectada a la base
   compartida para TODOS los dispositivos, sin que nadie tenga que copiar ni
   pegar nada. Se carga sola al abrir.

   COMO COMPLETARLA
   1. Consola de Firebase -> engranaje -> Configuracion del proyecto
   2. Seccion "Tus apps" -> icono </> -> opcion "Config"
   3. Copiar los valores y pegarlos abajo, respetando las comillas
   4. Reconstruir con:  python3 build.py
   5. Subir index.html y este archivo a GitHub

   ADVERTENCIA DE SEGURIDAD
   Este archivo viaja al repositorio publico. Mientras las reglas de la
   Realtime Database sigan abiertas (".read": true / ".write": true),
   cualquiera que lea el codigo puede acceder a TODOS los datos, incluidas
   las historias clinicas. La proteccion correcta no es ocultar esta
   direccion, sino exigir autenticacion en las reglas de Firebase.
   Ver reglas-firebase.txt, opcion B.

   Si se deja vacio, la app arranca en modo local y cada dispositivo puede
   configurarse a mano desde el indicador de sincronizacion, como antes.
   ========================================================================= */
'use strict';

const FIREBASE_EMBEBIDA = {
  apiKey: "AIzaSyC5BD7vjxTlewaXajYKJcPHIvtYXcOgiGc",
  authDomain: "afar-anestesia.firebaseapp.com",
  databaseURL: "https://afar-anestesia-default-rtdb.firebaseio.com",
  projectId: "afar-anestesia",
  storageBucket: "afar-anestesia.firebasestorage.app",
  messagingSenderId: "329744392924",
  appId: "1:329744392924:web:3f8a0cc69cdc54c8788a19"
};
