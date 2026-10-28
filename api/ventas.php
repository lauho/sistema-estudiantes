<?php
require_once '../config/database.php';

header('Content-Type: application/json');

$conn = getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT id, producto_id, producto_nombre, cantidad, precio_unitario, total, fecha
            FROM ventas ORDER BY id DESC";

    $resultado = $conn->query($sql);
    $datos = $resultado->fetch_all(MYSQLI_ASSOC);

    foreach ($datos as &$fila) {
        $fila['id'] = (int) $fila['id'];
        $fila['producto_id'] = (int) $fila['producto_id'];
        $fila['cantidad'] = (int) $fila['cantidad'];
        $fila['precio_unitario'] = (float) $fila['precio_unitario'];
        $fila['total'] = (float) $fila['total'];
    }
    unset($fila);

    echo json_encode($datos);
    exit;
}

if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    $productoId = (int) ($body['producto_id'] ?? 0);
    $cantidad = filter_var($body['cantidad'] ?? null, FILTER_VALIDATE_INT, [
        'options' => ['min_range' => 1],
    ]);

    if ($productoId <= 0 || $cantidad === false) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'mensaje' => 'Producto o cantidad inválidos.']);
        exit;
    }

    $resultado = $conn->query(
        "SELECT id, nombre, precio, stock FROM productos WHERE id = $productoId",
    );
    $producto = $resultado->fetch_assoc();

    if (!$producto) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'mensaje' => 'No se encontró el producto.']);
        exit;
    }

    if ((int) $producto['stock'] < $cantidad) {
        http_response_code(400);
        echo json_encode([
            'ok' => false,
            'mensaje' => 'No hay stock suficiente. Disponible: ' . (int) $producto['stock'] . '.',
        ]);
        exit;
    }

    $precio = (float) $producto['precio'];
    $total = $precio * $cantidad;
    $nombre = $conn->real_escape_string($producto['nombre']);
    $precioSql = number_format($precio, 2, '.', '');
    $totalSql = number_format($total, 2, '.', '');

    $conn->begin_transaction();

    $actualizado = $conn->query(
        "UPDATE productos
         SET stock = stock - $cantidad
         WHERE id = $productoId AND stock >= $cantidad",
    );

    if (!$actualizado || $conn->affected_rows === 0) {
        $conn->rollback();
        http_response_code(400);
        echo json_encode(['ok' => false, 'mensaje' => 'No hay stock suficiente.']);
        exit;
    }

    $insertado = $conn->query(
        "INSERT INTO ventas (producto_id, producto_nombre, cantidad, precio_unitario, total)
         VALUES ($productoId, '$nombre', $cantidad, $precioSql, $totalSql)",
    );

    if (!$insertado) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['ok' => false, 'mensaje' => 'Error al registrar la venta.']);
        exit;
    }

    $ventaId = $conn->insert_id;
    $conn->commit();

    echo json_encode([
        'ok' => true,
        'id' => $ventaId,
        'total' => round($total, 2),
        'stock' => (int) $producto['stock'] - $cantidad,
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['ok' => false, 'mensaje' => 'Método no permitido.']);
