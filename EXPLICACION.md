# Sistema de Productos — cómo funciona

Es un **inventario simple**: se cargan productos con nombre, precio y stock, y se
pueden listar, buscar, agregar, editar y eliminar. Todo pasa en una sola página,
sin recargar.

## Las tres capas

1. **`index.html`** — la pantalla: buscador, tabla y formularios.
2. **`js/app.js`** — el cerebro del navegador: pide los datos con `fetch`, arma
   las filas de la tabla y escucha los clics.
3. **`api/productos.php`** — recibe esas peticiones, habla con MySQL y devuelve
   JSON. La tabla `productos` vive en la base `sistema_estudiantes`.

## Un ejemplo de punta a punta

Cuando se agrega un producto:

1. El formulario no se envía de la forma tradicional: `app.js` lo frena con
   `preventDefault()`.
2. `validarProducto()` revisa precio y stock en el navegador.
3. Se manda un `POST` con los datos en JSON.
4. La API vuelve a validar (`validar_producto()`), hace el `INSERT` y responde
   `{ok: true, id: 6}`.
5. `app.js` muestra el mensaje y vuelve a pedir la lista con `GET`, que se
   dibuja de nuevo en la tabla.

Lo mismo pasa con editar (`PUT`), eliminar (`DELETE`) y los botones de stock
(`PATCH`).

## Cómo decide la API

Mira `$_SERVER['REQUEST_METHOD']` y tiene un bloque por método: `GET`, `POST`,
`PUT`, `PATCH` y `DELETE`. Si no coincide ninguno, responde `405`.

## Lo que se agregó

- Precio con formato de pesos (`$ 1.850,00`).
- Stock bajo resaltado (5 o menos).
- Validación en el navegador **y** en el servidor.
- Botones **−1 / +1** de stock con `PATCH`, sin dejar el stock en negativo.

## Para probarlo

```bash
php -S localhost:8000
```

Abrir `http://localhost:8000/` y mirar la pestaña **Network**: cada acción
muestra su `fetch` con el método y el JSON que viaja.
