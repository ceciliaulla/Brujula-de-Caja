# Brújula de Caja — proyecto real (Firestore)

Esto es la versión "de verdad" de la app: ya no corre dentro de un Artifact de Claude, corre como
una app web propia conectada a Firebase (Firestore + Authentication). Los pasos que siguen no
requieren instalar nada en tu computadora — todo el trabajo pesado (instalar dependencias,
compilar) lo hace Vercel automáticamente cuando conectás el repositorio.

## 1. Pegar las reglas de seguridad en Firebase

1. Andá a [console.firebase.google.com](https://console.firebase.google.com) → tu proyecto → Firestore → pestaña **"Reglas"**.
2. Reemplazá todo el contenido por el de `firestore.rules` (el archivo de esta carpeta) y publicá.

## 2. Subir este proyecto a GitHub (sin instalar nada)

1. Andá a [github.com](https://github.com) → **"New repository"** → ponele un nombre (por ejemplo `brujula-de-caja`) → creala **vacía** (sin README, sin .gitignore, eso ya lo tenés acá).
2. Adentro del repositorio recién creado, buscá el link **"uploading an existing file"** (o el botón "Add file" → "Upload files").
3. Arrastrá **todos los archivos y carpetas de esta carpeta** ahí (mantené la estructura: `src/` tiene que quedar como carpeta, no archivos sueltos).
4. Confirmá el commit ("Commit changes").

## 3. Conectar con Vercel y publicar

1. Andá a [vercel.com](https://vercel.com) → **"Add New..."** → **"Project"**.
2. Si te pide conectar GitHub, autorizalo — ahí te va a aparecer el repositorio que acabás de crear.
3. Elegilo → Vercel detecta solo que es un proyecto Vite/React, no hace falta tocar nada de la configuración.
4. Tocá **"Deploy"**. En unos minutos te da una dirección como `brujula-de-caja.vercel.app`.

## 4. Probar

- Entrá a esa dirección, iniciá sesión con tu usuario (el que marcaste como "asesora").
- Como todavía no hay ningún negocio cargado en Firestore, vas a ver el selector de cliente vacío.
- Para probar con datos, podés crear a mano un documento en Firestore: colección `negocios`, ID de documento cualquiera (por ejemplo `prueba1`), con un campo `nombreNegocio: "Negocio de prueba"`. Al refrescar la app, debería aparecerte en el selector.

## Si algo no funciona

Los errores más comunes al principio:
- **Pantalla en blanco**: revisá la consola del navegador (F12 → pestaña "Console") y pegame el mensaje de error exacto.
- **"Falta de permisos" al cargar o guardar**: probablemente las reglas de seguridad (paso 1) no se guardaron, o el usuario no tiene su documento en `roles/`.
- **No aparece ningún cliente en el selector**: es esperable al principio — todavía no creaste ningún negocio en Firestore (ver paso 4).
