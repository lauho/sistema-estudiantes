<?php
require_once "config/database.php";
$conn = getConnection();

if (isset($_GET["id"])) {
    $id = (int) $_GET["id"];
    $conn->query("UPDATE estudiantes SET activo = 0 WHERE id = $id");
    header("Location: index.php");
    exit();
}
?>
