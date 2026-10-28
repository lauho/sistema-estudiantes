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

| Archivo                  | Qué hace                                            |
| ------------------------ | --------------------------------------------------- |
| `index.html`             | Tabla, buscador y formularios (la app)              |
| `js/app.js`              | `fetch` a la API y armado del DOM                   |
| `api/productos.php`      | API JSON: GET, POST, PUT y DELETE                   |
| `includes/productos.php` | Validación de precio y stock del lado del servidor  |
| `config/database.php`    | Conexión a MySQL                                    |
| `index.php`              | Redirige a `index.html`                             |

## Uso

- El buscador filtra por nombre mientras se escribe.
- El formulario de abajo agrega un producto.
- **Editar** abre un modal con los datos cargados.
- **Eliminar** borra el producto (pide confirmación).

## API

| Método   | Datos                         | Respuesta          |
| -------- | ----------------------------- | ------------------ |
| `GET`    | `?q=` (opcional)              | Lista de productos |
| `POST`   | `{nombre, precio, stock}`     | `{ok, id}`         |
| `PUT`    | `{id, nombre, precio, stock}` | `{ok, id}`         |
| `DELETE` | `?id=`                        | `{ok, id}`         |

Los errores de validación devuelven `400` con
`{ok: false, mensaje: "..."}`.

La API decide qué operación ejecutar mirando `$_SERVER['REQUEST_METHOD']`: un
`if` por método (`GET`, `POST`, `PUT` y `DELETE`), y si no coincide ninguno
responde `405`.
