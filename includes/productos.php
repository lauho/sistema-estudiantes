<?php
const PRODUCTO_PRECIO_MAX = 99999999.99;
const PRODUCTO_STOCK_MAX = 1000000;

/**
 * Valida y normaliza los datos de un producto.
 * La usan tanto la API como el formulario, así el servidor
 * nunca confía en lo que manda el navegador.
 */
function validar_producto(array $datos): array
{
    $nombre = trim((string) ($datos["nombre"] ?? ""));
    $precio = $datos["precio"] ?? "";
    $stock = $datos["stock"] ?? "";

    if ($nombre === "") {
        return [
            "ok" => false,
            "mensaje" => "El nombre es obligatorio.",
            "valores" => null,
        ];
    }

    if ($precio === "" || !is_numeric($precio)) {
        return [
            "ok" => false,
            "mensaje" => "El precio debe ser un número.",
            "valores" => null,
        ];
    }

    $precio = (float) $precio;

    if ($precio < 0) {
        return [
            "ok" => false,
            "mensaje" => "El precio no puede ser negativo.",
            "valores" => null,
        ];
    }

    if ($precio > PRODUCTO_PRECIO_MAX) {
        return [
            "ok" => false,
            "mensaje" => "El precio es demasiado alto.",
            "valores" => null,
        ];
    }

    $stock = filter_var($stock, FILTER_VALIDATE_INT, [
        "options" => ["min_range" => 0, "max_range" => PRODUCTO_STOCK_MAX],
    ]);

    if ($stock === false) {
        return [
            "ok" => false,
            "mensaje" => "El stock debe ser un número entero mayor o igual a 0.",
            "valores" => null,
        ];
    }

    return [
        "ok" => true,
        "mensaje" => "",
        "valores" => [
            "nombre" => $nombre,
            "precio" => round($precio, 2),
            "stock" => (int) $stock,
        ],
    ];
}
