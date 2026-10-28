# Novedades

Resumen de lo que puede hacer el sistema ahora.

## Productos
- Listar, buscar, agregar, editar y eliminar productos **sin recargar la página**.
- Cada producto tiene **nombre, precio y stock**.
- El buscador filtra por nombre mientras se escribe.
- Muestra el **total de productos** listados.

## Precio y stock
- Precio formateado en **pesos argentinos** (`$ 1.850,00`).
- Los productos con **stock bajo** (5 o menos) se resaltan con la etiqueta **Stock bajo**.
- Botones **−1 / +1** para cambiar el stock de a una unidad (`PATCH`).
- El stock nunca queda negativo: con 0, el botón −1 se deshabilita.

## Validación
- El **precio** debe ser un número mayor o igual a 0.
- El **stock** debe ser un número entero mayor o igual a 0.
- Se valida en el navegador **y** en el servidor.

## Técnico
- API JSON: `GET`, `POST`, `PUT`, `PATCH` y `DELETE`.
- Borrado real con confirmación.
- `index.php` redirige a `index.html`.
