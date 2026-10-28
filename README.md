# Sistema de Productos

CRUD simple en PHP y MySQL para gestionar productos (nombre, precio y stock).
Listar, buscar, agregar, editar y eliminar funciona **sin recargar la página**
con `fetch` + DOM.

## Requisitos

- PHP 7.4+
- MySQL / MariaDB
- Servidor web (Apache, Nginx o `php -S`)

## Instalación

1. Clonar / copiar el proyecto en `/var/www/html/sistema_estudiantes`
2. Crear la base de datos y la tabla:

```sql
CREATE DATABASE sistema_estudiantes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0
);

CREATE TABLE ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total DECIMAL(10,2) NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE venta_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL,
    producto_id INT NOT NULL,
    producto_nombre VARCHAR(100) NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    KEY venta_id (venta_id)
);
```

3. Configurar las credenciales en `config/database.php`:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'admin');
define('DB_PASS', 'alumno');
define('DB_NAME', 'sistema_estudiantes');
```

4. Iniciar el servidor:

```bash
php -S localhost:8000
```

Entrar a `http://localhost:8000/` (redirige a `index.html`).

## Estructura

| Archivo                | Qué hace                                              |
| ---------------------- | ----------------------------------------------------- |
| `index.html`           | Tabla, buscador y formularios (la app)                |
| `js/app.js`            | `fetch` a la API y armado del DOM                     |
| `api/productos.php`    | API JSON: GET, POST, PUT, PATCH y DELETE              |
| `api/ventas.php`       | API JSON: GET y POST de ventas                        |
| `includes/productos.php` | Validación de precio y stock del lado del servidor  |
| `config/database.php`  | Conexión a MySQL                                      |
| `index.php`            | Redirige a `index.html`                               |

## Uso

- El buscador filtra por nombre mientras se escribe, con un debounce de 300 ms
  (espera a que dejes de tipear antes de consultar la API).
- El formulario de abajo agrega un producto.
- **Editar** abre un modal con los datos cargados.
- **Eliminar** borra el producto (pide confirmación).
- Los botones **−1 / +1** cambian el stock de a una unidad.
- **Registrar venta** abre un modal donde se agregan uno o varios productos con
  su cantidad y se ve el total. Al confirmar se descuenta el stock y la venta
  aparece en la tabla de abajo con su lista de productos, sin recargar la página.

## Mejoras (Nivel 2)

1. **Formato de precio en pesos**: se muestra con
   `Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" })`,
   por ejemplo `$ 1.850,00`.
2. **Resaltar stock bajo**: si el stock es menor o igual a `UMBRAL_STOCK_BAJO`
   (5), la fila se pinta y aparece la etiqueta **Stock bajo**.
3. **Validación de precio y stock**: se valida en el navegador
   (`validarProducto()` en `app.js`) y otra vez en el servidor
   (`validar_producto()` en `includes/productos.php`). El precio no puede ser
   negativo y el stock debe ser un entero mayor o igual a 0.

## Desafío (Nivel 3)

**Botones +1 / −1 de stock con PATCH.** Cada botón manda
`PATCH api/productos.php?id=5&delta=1` (o `-1`). La API lee el stock actual, le
suma el delta, nunca deja el stock en negativo y devuelve el stock nuevo.

## API

### Productos

| Método   | Datos                          | Respuesta              |
| -------- | ------------------------------ | ---------------------- |
| `GET`    | `?q=` (opcional)               | Lista de productos     |
| `POST`   | `{nombre, precio, stock}`      | `{ok, id}`             |
| `PUT`    | `{id, nombre, precio, stock}`  | `{ok, id}`             |
| `PATCH`  | `?id=&delta=1` o `delta=-1`    | `{ok, id, stock}`      |
| `DELETE` | `?id=`                         | `{ok, id}`             |

### Ventas

| Método | Datos                                  | Respuesta                |
| ------ | -------------------------------------- | ------------------------ |
| `GET`  | —                                      | Ventas con su detalle    |
| `POST` | `{items: [{producto_id, cantidad}]}`   | `{ok, id, total}`        |

El `POST` valida el stock de todos los productos, descuenta las cantidades y
guarda la venta en `ventas` y sus líneas en `venta_detalle`. Si algún producto
no tiene stock, no se guarda nada (se usa una transacción). Cada línea guarda el
nombre y el precio del momento: si después cambia el producto, la venta no se
altera.

Los errores de validación devuelven `400` con
`{ok: false, mensaje: "..."}`.

La API decide qué operación ejecutar mirando `$_SERVER['REQUEST_METHOD']`: un
`if` por método (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`), y si no coincide
ninguno responde `405`.
