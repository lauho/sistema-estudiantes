<?php
require_once '../config/database.php';

header('Content-Type: application/json');

$conn = getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $ventas = $conn->query(
        "SELECT id, total, fecha FROM ventas ORDER BY id DESC",
    )->fetch_all(MYSQLI_ASSOC);

    $detalles = $conn->query(
        "SELECT id, venta_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal
         FROM venta_detalle ORDER BY id",
    )->fetch_all(MYSQLI_ASSOC);

    $porVenta = [];

    foreach ($detalles as $detalle) {
        $ventaId = (int) $detalle['venta_id'];

        $porVenta[$ventaId][] = [
            'id' => (int) $detalle['id'],
            'producto_id' => (int) $detalle['producto_id'],
            'producto_nombre' => $detalle['producto_nombre'],
            'cantidad' => (int) $detalle['cantidad'],
            'precio_unitario' => (float) $detalle['precio_unitario'],
            'subtotal' => (float) $detalle['subtotal'],
        ];
    }

    $datos = [];

    foreach ($ventas as $venta) {
        $datos[] = [
            'id' => (int) $venta['id'],
            'total' => (float) $venta['total'],
            'fecha' => $venta['fecha'],
            'detalle' => $porVenta[(int) $venta['id']] ?? [],
        ];
    }

    echo json_encode($datos);
    exit;
}

if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $items = $body['items'] ?? null;

    if (!is_array($items) || count($items) === 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'mensaje' => 'Agregá al menos un producto.']);
        exit;
    }

    $cantidades = [];

    foreach ($items as $item) {
        $productoId = (int) ($item['producto_id'] ?? 0);
        $cantidad = filter_var($item['cantidad'] ?? null, FILTER_VALIDATE_INT, [
            'options' => ['min_range' => 1],
        ]);

        if ($productoId <= 0 || $cantidad === false) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'mensaje' => 'Producto o cantidad inválidos.']);
            exit;
        }

        $cantidades[$productoId] = ($cantidades[$productoId] ?? 0) + $cantidad;
    }

    $lineas = [];
    $total = 0;

    foreach ($cantidades as $productoId => $cantidad) {
        $resultado = $conn->query(
            "SELECT id, nombre, precio, stock FROM productos WHERE id = $productoId",
        );
        $producto = $resultado->fetch_assoc();

        if (!$producto) {
            http_response_code(404);
            echo json_encode(['ok' => false, 'mensaje' => 'No se encontró un producto de la venta.']);
            exit;
        }

        if ((int) $producto['stock'] < $cantidad) {
            http_response_code(400);
            echo json_encode([
                'ok' => false,
                'mensaje' => 'No hay stock suficiente de ' . $producto['nombre']
                    . '. Disponible: ' . (int) $producto['stock'] . '.',
            ]);
            exit;
        }

        $precio = (float) $producto['precio'];
        $subtotal = $precio * $cantidad;
        $total += $subtotal;

        $lineas[] = [
            'id' => (int) $producto['id'],
            'nombre' => $producto['nombre'],
            'cantidad' => $cantidad,
            'precio' => $precio,
            'subtotal' => $subtotal,
        ];
    }

    $conn->begin_transaction();

    $totalSql = number_format($total, 2, '.', '');
    $creada = $conn->query("INSERT INTO ventas (total) VALUES ($totalSql)");

    if (!$creada) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['ok' => false, 'mensaje' => 'Error al registrar la venta.']);
        exit;
    }

    $ventaId = $conn->insert_id;

    foreach ($lineas as $linea) {
        $actualizado = $conn->query(
            "UPDATE productos
             SET stock = stock - {$linea['cantidad']}
             WHERE id = {$linea['id']} AND stock >= {$linea['cantidad']}",
        );

        if (!$actualizado || $conn->affected_rows === 0) {
            $conn->rollback();
            http_response_code(400);
            echo json_encode([
                'ok' => false,
                'mensaje' => 'No hay stock suficiente de ' . $linea['nombre'] . '.',
            ]);
            exit;
        }

        $nombre = $conn->real_escape_string($linea['nombre']);
        $precioSql = number_format($linea['precio'], 2, '.', '');
        $subtotalSql = number_format($linea['subtotal'], 2, '.', '');

        $insertado = $conn->query(
            "INSERT INTO venta_detalle
                (venta_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
             VALUES
                ($ventaId, {$linea['id']}, '$nombre', {$linea['cantidad']}, $precioSql, $subtotalSql)",
        );

        if (!$insertado) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(['ok' => false, 'mensaje' => 'Error al registrar la venta.']);
            exit;
        }
    }

    $conn->commit();

    echo json_encode([
        'ok' => true,
        'id' => $ventaId,
        'total' => round($total, 2),
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['ok' => false, 'mensaje' => 'Método no permitido.']);
