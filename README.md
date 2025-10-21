# motiv8
Proyecto de título Capstone "Motiv8"

---

Aplicación web orientada a fomentar el deporte en personas cercanas a la tecnología y videojuegos, por medio de recompensas y objetivos que incentivan a los usuarios a realizar o reforzar su actividad física. 

## DevDependencies (no es necesario instalar)

npm version 10.9.3
vite version: 7.1.8
node version 22.20.0

## Instalación y Levantamiento

Dependencias del proyecto(deben instalarse para el funcionamiento correcto):

FRONTEND:
    react: 19.2.0
    react-dom: 19.2.0
    react-router-dom: 7.9.3
    axios: 1.12.2
    firebase 12.4.0

Código instalación:

```cmd
cd frontend
npm install react@19.2.0 react-dom@19.2.0 react-router-dom@7.9.3 axios@1.12.2 firebase@12.4.0
cd..
```

DOCS:
 - [React DOCS](https://es.react.dev/learn)
 - [Vite Framework](https://vite.dev/guide/)


BACKEND:
    express: 5.1.0
    cors: 2.8.5
    firebase-admin 13.5.0

Código instalación:

```cmd
cd backend
npm install express@5.1.0 cors@2.8.5 firebase-admin@13.5.0
cd..
```

DOCS:
 - [Node.js DOCS](https://nodejs.org/es/)
 - [Express Framework](https://expressjs.com/es/)


API Strava:
    strava-api: x

Instalación:
    ```
    Próximamente...
    ```

DOCS:
 - [Strava API V3](https://developers.strava.com/docs/reference/)


LEVANTAMIENTO

Luego de haber intalado las dependencias hay que levantar el backend y el frontend.

Levantar backend:
    ```cmd
    cd backend
    npm start
    ```

Levantar frontend:
    ```cmd
    cd frontend
    npm run dev
    ```

Luego entrar al frontend en el navegador.
    - Por defecto, el frontend se levanta en el puerto 5173.
    - Entrar en el navegador a la dirección `http://localhost:5173`.

 ---


## Guía crear vistas

Los siguientes pasos son necesarios para crear vistas en la aplicación y que puedan ser navegables por react router y agregarlas al navbar.

1. Crear el archivo de la vista en la carpeta `src/pages`.
    - El archivo debe tener el nombre de la vista en minúsculas y extensión `.jsx`.
    - El archivo debe contener el siguiente código:
    ```jsx
    import React from 'react';

    function Vista() {
        return (
            <div>
                <h1>Esta es la nueva vista</h1>
            </div>
        );
    }

    export default Vista;
    ```

2. Importar la vista en el archivo `src/App.jsx`.
    - Agregar la importación en el archivo `src/App.jsx` antes de la función `App`.
    ```jsx
    import Vista from './pages/vista';
    ```

3. Agregar la ruta de la vista en el archivo `src/App.jsx`.
    - Dentro de la función `App`, agregar la ruta de la vista dentro de la etiqueta `<Routes>`.
    ```jsx
    <Route path="/vista" element={<Vista />} />
    ```

4. Agregar el link de la vista en el archivo `src/components/navbar.jsx`.
    - Dentro de la función `Navbar`, agregar el link de la vista dentro de la etiqueta `<nav>`.
    ```jsx
    <nav>
        <Link to="/vista">Vista</Link>
    </nav>
    ``` 
