<?php
require_once '../config/database.php';
require_once '../includes/notas.php';

header('Content-Type: application/json');

$conn = getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $busqueda = trim($_GET['q'] ?? '');
    $activo = $_GET['activo'] ?? '1';

    if ($activo !== '0' && $activo !== '1' && $activo !== '') {
        $activo = '1';
    }

    $condiciones = [];

    if ($activo === '1' || $activo === '0') {
        $condiciones[] = "activo = $activo";
    }

    if ($busqueda) {
        $b = $conn->real_escape_string($busqueda);
        $condiciones[] = "(nombre LIKE '%$b%' OR apellido LIKE '%$b%')";
    }

    $where = $condiciones ? 'WHERE ' . implode(' AND ', $condiciones) : '';

    $sql = "SELECT id, nombre, apellido, email, notas, activo
            FROM estudiantes $where ORDER BY apellido";

    $resultado = $conn->query($sql);
    $datos = $resultado->fetch_all(MYSQLI_ASSOC);

    foreach ($datos as &$fila) {
        $fila['activo'] = (int) $fila['activo'];
        $fila['promedio'] = notas_a_promedio($fila['notas']);
        $fila['estado'] = notas_a_estado($fila['notas']);
    }
    unset($fila);

    echo json_encode($datos);
    exit;
}

if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);

    $nombre = trim($body['nombre'] ?? '');
    $apellido = trim($body['apellido'] ?? '');
    $email = trim($body['email'] ?? '');

    if (empty($nombre) || empty($apellido) || empty($email)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'mensaje' => 'Datos incompletos']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'mensaje' => 'El email no es válido.']);
        exit;
    }

    $notas = validar_notas($body['notas'] ?? []);

    if (!$notas['ok']) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'mensaje' => $notas['mensaje']]);
        exit;
    }

    $n = $conn->real_escape_string($nombre);
    $a = $conn->real_escape_string($apellido);
    $e = $conn->real_escape_string($email);
    $no = $conn->real_escape_string($notas['valor']);

    $sql = "INSERT INTO estudiantes (nombre, apellido, email, notas)
            VALUES ('$n', '$a', '$e', '$no')";

    if ($conn->query($sql)) {
        echo json_encode(['ok' => true, 'id' => $conn->insert_id]);
    } else {
        echo json_encode(['ok' => false, 'mensaje' => 'Error al guardar.']);
    }
    exit;
}

if ($method === 'PUT') {
    $body = json_decode(file_get_contents('php://input'), true);

    $id = (int) ($body['id'] ?? 0);
    $nombre = trim($body['nombre'] ?? '');
    $apellido = trim($body['apellido'] ?? '');
    $email = trim($body['email'] ?? '');

    if ($id === 0 || empty($nombre) || empty($apellido) || empty($email)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'mensaje' => 'Datos incompletos']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'mensaje' => 'El email no es válido.']);
        exit;
    }

    $notas = validar_notas($body['notas'] ?? []);

    if (!$notas['ok']) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'mensaje' => $notas['mensaje']]);
        exit;
    }

    $n = $conn->real_escape_string($nombre);
    $a = $conn->real_escape_string($apellido);
    $e = $conn->real_escape_string($email);
    $no = $conn->real_escape_string($notas['valor']);

    $sql = "UPDATE estudiantes
            SET nombre = '$n', apellido = '$a', email = '$e', notas = '$no'
            WHERE id = $id";

    if ($conn->query($sql)) {
        echo json_encode(['ok' => true, 'id' => $id]);
    } else {
        echo json_encode(['ok' => false, 'mensaje' => 'Error al actualizar.']);
    }
    exit;
}

if ($method === 'PATCH') {
    $id = (int) ($_GET['id'] ?? 0);

    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'mensaje' => 'Falta el id']);
        exit;
    }

    $sql = "UPDATE estudiantes SET activo = 1 WHERE id = $id";

    if ($conn->query($sql)) {
        echo json_encode(['ok' => true, 'id' => $id]);
    } else {
        echo json_encode(['ok' => false, 'mensaje' => 'Error al reactivar.']);
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

    $sql = "UPDATE estudiantes SET activo = 0 WHERE id = $id";

    if ($conn->query($sql)) {
        echo json_encode(['ok' => true, 'id' => $id]);
    } else {
        echo json_encode(['ok' => false, 'mensaje' => 'Error al eliminar.']);
    }
    exit;
}