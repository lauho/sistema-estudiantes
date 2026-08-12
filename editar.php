<?php
require_once "config/database.php";
$conn = getConnection();

$mensaje = "";

$def_nombre = "";
$def_apellido = "";
$def_email = "";

if (!isset($_GET["id"])) {
    header("Location: index.php");
    exit();
}

$id = (int) $_GET["id"];

$resultado = $conn->query(
    "SELECT nombre, apellido, email
         FROM estudiantes
         WHERE id = $id",
);

if ($fila = $resultado->fetch_assoc()) {
    $def_nombre = $fila["nombre"];
    $def_apellido = $fila["apellido"];
    $def_email = $fila["email"];
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $nombre = trim($_POST["nombre"] ?? "");
    $apellido = trim($_POST["apellido"] ?? "");
    $email = trim($_POST["email"] ?? "");

    if (empty($nombre) || empty($apellido) || empty($email)) {
        $mensaje = "Todos los campos son obligatorios.";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $mensaje = "El email no es válido.";
    } else {
        $nombre = $conn->real_escape_string($nombre);
        $apellido = $conn->real_escape_string($apellido);
        $email = $conn->real_escape_string($email);

        $sql = "UPDATE estudiantes SET nombre = '$nombre', apellido = '$apellido', email = '$email' WHERE id = $id";

        if ($conn->query($sql)) {
            $mensaje = "Estudiante actualizado correctamente. ID: " . $id;
        } else {
            $mensaje = "Error: " . $conn->error;
        }
    }
}

require_once "includes/header.php";
?>

<?php if ($mensaje): ?>
    <p><strong><?= htmlspecialchars($mensaje) ?></strong></p>
<?php endif; ?>

<a href="index.php">Volver</a>

<form method="post">
    <label>Nombre:   <input type="text"  name="nombre"   required value="<?= htmlspecialchars(
        $def_nombre,
    ) ?>"></label><br>
    <label>Apellido: <input type="text"  name="apellido" required value="<?= htmlspecialchars(
        $def_apellido,
    ) ?>"></label><br>
    <label>Email:    <input type="email" name="email"    required value="<?= htmlspecialchars(
        $def_email,
    ) ?>"></label><br>
    <button type="submit">Editar estudiante</button>
</form>
