# Firebase gratis para Copa Facil

Usa el plan gratuito Spark de Firebase.

## 1. Crear proyecto

1. Entra a Firebase Console.
2. Crea un proyecto nuevo.
3. No actives Google Analytics si no lo necesitas.
4. En Firestore Database, crea una base de datos.
5. Para empezar rapido, usa modo de prueba. Luego puedes cerrar reglas si lo necesitas.

## 2. Crear app web

1. En el proyecto Firebase, agrega una app Web.
2. Copia la configuracion que Firebase muestra.
3. Pega los valores en Netlify como variables de entorno:

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## 3. Publicar en Netlify

Build command:

```text
npm run build
```

Publish directory:

```text
dist
```

La app guarda todo en Firestore en:

```text
copaFacil/mainState
```

Si las variables de Firebase no existen, la app funciona en modo local con localStorage.
