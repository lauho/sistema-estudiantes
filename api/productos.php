<?php
require_once '../config/database.php';
require_once '../includes/productos.php';

header('Content-Type: application/json');

$conn = getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $busqueda = trim($_GET['q'] ?? '');

    $condiciones = [];

    if ($busqueda !== '') {
        $b = $conn->real_escape_string($busqueda);
        $condiciones[] = "nombre LIKE '%$b%'";
    }

    $where = $condiciones ? 'WHERE ' . implode(' AND ', $condiciones) : '';

    $sql = "SELECT id, nombre, precio, stock
            FROM productos $where ORDER BY nombre";

    $resultado = $conn->query($sql);
    $datos = $resultado->fetch_all(MYSQLI_ASSOC);

    foreach ($datos as &$fila) {
        $fila['id'] = (int) $fila['id'];
        $fila['precio'] = (float) $fila['precio'];
        $fila['stock'] = (int) $fila['stock'];
    }
    unset($fila);

    echo json_encode($datos);
    exit;
}

if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $producto = validar_producto($body);

    if (!$producto['ok']) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'mensaje' => $producto['mensaje']]);
        exit;
    }

    $n = $conn->real_escape_string($producto['valores']['nombre']);
    $p = number_format($producto['valores']['precio'], 2, '.', '');
    $s = $producto['valores']['stock'];

    $sql = "INSERT INTO productos (nombre, precio, stock)
            VALUES ('$n', $p, $s)";

    if ($conn->query($sql)) {
        echo json_encode(['ok' => true, 'id' => $conn->insert_id]);
    } else {
        echo json_encode(['ok' => false, 'mensaje' => 'Error al guardar.']);
    }
    exit;
}

if ($method === 'PUT') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    $id = (int) ($body['id'] ?? 0);

    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'mensaje' => 'Falta el id']);
        exit;
    }

    $producto = validar_producto($body);

    if (!$producto['ok']) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'mensaje' => $producto['mensaje']]);
        exit;
    }

    $n = $conn->real_escape_string($producto['valores']['nombre']);
    $p = number_format($producto['valores']['precio'], 2, '.', '');
    $s = $producto['valores']['stock'];

    $sql = "UPDATE productos
            SET nombre = '$n', precio = $p, stock = $s
            WHERE id = $id";

    if ($conn->query($sql)) {
        echo json_encode(['ok' => true, 'id' => $id]);
    } else {
        echo json_encode(['ok' => false, 'mensaje' => 'Error al actualizar.']);
    }
    exit;
}

if ($method === 'DELETE') {
    $id = (int) ($_GET['id'] ?? 0);

    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'mensaje' => 'Falta el id']);
        exit;
    }

    $conn->query("DELETE FROM productos WHERE id = $id");

    if ($conn->affected_rows > 0) {
        echo json_encode(['ok' => true, 'id' => $id]);
    } else {
        http_response_code(404);
        echo json_encode(['ok' => false, 'mensaje' => 'No se encontró el producto.']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['ok' => false, 'mensaje' => 'Método no permitido.']);
