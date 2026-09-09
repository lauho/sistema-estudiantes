# Sistema de Estudiantes

CRUD simple en PHP y MySQL para gestionar estudiantes.

## Requisitos

- PHP 7.4+
- MySQL / MariaDB
- Servidor web (Apache, Nginx)

## Instalación

1. Clonar / copiar el proyecto en `/var/www/html/sistema_estudiantes`
2. Crear la base de datos:

```sql
CREATE DATABASE sistema_estudiantes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE estudiantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    activo TINYINT(1) DEFAULT 1
);
```

3. Configurar credenciales en `config/database.php`:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'admin');
define('DB_PASS', 'alumno');
define('DB_NAME', 'sistema_estudiantes');
```

4. Iniciar el servidor:

```bash
php -S localhost:8000
# o colocar el proyecto bajo Apache/Nginx
```

## Uso

- `index.php` - Lista estudiantes activos, búsqueda por nombre/apellido
- `crear.php` - Formulario para agregar estudiante
- `editar.php?id=1` - Editar estudiante existente
- `eliminar.php?id=1` - Desactiva estudiante (baja lógica)
