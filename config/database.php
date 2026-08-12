<?php
define('DB_HOST', 'localhost');
define('DB_USER', 'admin');
define('DB_PASS', 'alumno');
define('DB_NAME', 'sistema_estudiantes');

function getConnection(): mysqli {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        die('Error de conexión: ' . $conn->connect_error);
    }
    $conn->set_charset('utf8mb4');
    return $conn;
}
?>
