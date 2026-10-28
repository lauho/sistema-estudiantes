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
    notas VARCHAR(24) DEFAULT NULL,
    activo TINYINT(1) DEFAULT 1
);
```

> `notas` guarda las 4 notas en una sola columna como `"8.5,7,9,10"` (CSV sin
> espacios). `VARCHAR(24)` da margen de sobra: el peor caso es `"9.5,10,9.5,10"`.
>
> Si tenés la tabla creada sin esta columna:
>
> ```sql
> ALTER TABLE estudiantes ADD COLUMN notas VARCHAR(24) DEFAULT NULL;
> ```
>
> Las notas son **obligatorias** en el CRUD (si el `required` del navegador se
> salta, la validación del servidor la vuelve a pedir). Para que la base de datos
> también lo exija:
>
> ```sql
> -- Antes: hay que dejar vacía la columna DEFAULT
> ALTER TABLE estudiantes MODIFY notas VARCHAR(24) NOT NULL;
> ```

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

## Notas

Cada estudiante tiene 4 notas, todas en el rango **1 a 10**. El promedio y el
estado (Aprobado / Desaprobado, umbral 6) se calculan al vuelo, no se guardan.

### Botones de acciones

Las acciones van en un `<div class="acciones">` con `display: flex` y
`align-items: center`, sin `role="group"` de Pico (los botones quedan
separados, no unidos).

La celda que las contiene lleva `class="acciones-td"` con
`vertical-align: middle`. hace falta porque el div flex tiene alto automático
(del tamaño del botón), así que queda pegado al borde superior de la celda:
`align-items` centra dentro del div, pero el div es lo que hay que centrar
dentro de la celda.

En `index.php` las acciones son enlaces, y Pico v2 solo estila `<button>` de
forma nativa: los `<a>` llevan `role="button"` (no existe una clase `.button`
en Pico v2).

El tamaño de los botones se ajusta sobreescribiendo las variables de Pico,
porque el `font-size` de los botones viene hardcodeado en `1rem`:

```css
.acciones button {
    --pico-form-element-spacing-vertical: 0.2rem;
    --pico-form-element-spacing-horizontal: 0.5rem;
    margin-bottom: 0;
    font-size: 0.75rem;
}
```

El `margin-bottom: 0` no es opcional. Pico aplica
`margin-bottom: var(--pico-spacing)` (20px) a `[type=button]`,
`[type=reset]` y `[type=submit]`, así que el botón ocupa una caja de
28 + 20 = 48px. Como el div mide justo eso, `align-items: center` centra la
caja de márgenes y el botón **no se mueve**: queda pegado arriba. Pico solo lo
resetea dentro de sus propios footers.

### Activos e inactivos

Eliminar es una **baja lógica**: `DELETE` (o `eliminar.php`) pone `activo = 0`,
no borra la fila. Para volver a verla está `PATCH api/estudiantes.php?id=N`
(o `reactivar.php?id=N`), que la reactiva.

En los dos listados hay un select con **Solo activos / Solo inactivos /
Activos e inactivos**. En `index.php` va por query string (`?activo=0`); en
`index.html` se manda como parámetro en el fetch. Las filas inactivas se
distinguen por una etiqueta "Inactivo" y muestran **Reactivar** en vez de
**Eliminar**.

| Valor de `activo` | Resultado              |
| ----------------- | ---------------------- |
| `1` o ausente     | Solo activos (default) |
| `0`               | Solo inactivos         |
| `""`              | Todos                  |
| Cualquier otro    | Cae al default (`1`)   |

### Estilos de la tabla

La tabla usa `class="striped"` de Pico (filas alternadas) y los encabezados
llevan `scope="col"`. Los valores de `scope` están en el HTML estático, así que
aplican igual en `index.html` y `index.php`.

### Modal de edición

Pico centra el `<dialog>` con `min-height: 100%` y lo estira con
`min-width: 100%`, así que para que no crezca hasta el ancho del viewport hay
que anular el `min-width`. Si además se quiere limitar el alto, hay que anular
también el `min-height`, porque **en CSS `min-height` le gana a `max-height`**.

```css
#modal-editar {
    min-width: 0;
    width: 40rem;
    max-width: calc(100% - 2rem);
    overflow-y: auto;
}
```

El `overflow-y: auto` es la red de seguridad para viewports muy bajos: sin él,
el footer con Guardar/Cancelar queda cortada y no se puede llegar.

### Ordenar

En `index.html` se hace click en el encabezado de **Nombre, Apellido, Email o
Notas** para ordenar. Cada click alterna ascendente/descendente, y el
indicador ▲/▼ se pone en la columna activa. Ordenar por Notas usa el promedio.

Las filas se ordenan moviéndolas en el DOM: cada `<tr>` guarda sus valores en
`data-nombre`, `data-apellido`, `data-email` y `data-promedio`. Los textos se
comparan con `localeCompare(..., "es")` para que las tildes ordenen bien
(`Álvarez` antes que `zeta`), y los que no tienen notas van siempre al final.

### Filtro por estado

Se puede filtrar por **Aprobado / Desaprobado** en los dos listados. En
`index.php` va por query string (`?estado=Aprobado`) y se filtra en PHP; en
`index.html` el `<select>` marca cada fila con `data-estado` y las oculta.

No se puede filtrar en SQL: `notas` es un CSV en un `varchar`, así que el
promedio hay que calcularlo en PHP o JavaScript.

### Cómo se cargan

En la web (`index.html`) hay **un solo input** de texto que acepta las 4 notas
separadas por coma, con el promedio Calculado en vivo mientras se escribe:

```
8.5,7,9,10
```

El separador es la coma, así que **los decimales van con punto**. Si se escribe
`8,5,7,9,10` (coma decimal del teclado en español) el parser lo rechaza
explicando el error, en vez de adivinar.

En la base de datos el formato es el mismo CSV sin espacios: `"8.5,7,9,10"`.

La validación vive una sola vez en `includes/notas.php` y la usan tanto la API
como los formularios PHP:

| Función                   | Qué hace                                            |
| ------------------------- | --------------------------------------------------- |
| `validar_notas()`         | Valida las 4 notas y devuelve `"8.5,7,9,10"` listo   |
| `leer_notas_post()`       | Lee `$_POST["notas"][]`                              |
| `notas_a_promedio()`      | `"8.5,7,9,10"` → `8.625`                            |
| `notas_a_estado()`        | Promedio ≥ 6 → `"Aprobado"`, si no `"Desaprobado"`   |

`NOTAS_CANTIDAD`, `NOTAS_MIN`, `NOTAS_MAX` y `NOTAS_APROBADO` son las
constantes de rango y cantidad.

### API

| Método   | Campos                             | Respuesta                    |
| -------- | ---------------------------------- | ---------------------------- |
| `GET`    | `?q=` (opcional)                    | Lista + `promedio`/`estado`   |
| `POST`   | `nombre`, `apellido`, `email`, `notas[]` | `{ok, id}`             |
| `PUT`    | `id` + los anteriores              | `{ok, id}`                   |
| `DELETE` | `?id=`                             | Baja lógica                  |
