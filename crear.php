<?php
require_once "config/database.php";

$mensaje = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $nombre = trim($_POST["nombre"] ?? "");
    $apellido = trim($_POST["apellido"] ?? "");
    $email = trim($_POST["email"] ?? "");

    if (empty($nombre) || empty($apellido) || empty($email)) {
        $mensaje = "Todos los campos son obligatorios.";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $mensaje = "El email no es válido.";
    } else {
        $conn = getConnection();

        $nombre = $conn->real_escape_string($nombre);
        $apellido = $conn->real_escape_string($apellido);
        $email = $conn->real_escape_string($email);

        $sql = "INSERT INTO estudiantes (nombre, apellido, email)
               VALUES ('$nombre', '$apellido', '$email')";

        if ($conn->query($sql)) {
            $mensaje =
                "Estudiante agregado correctamente. ID: " . $conn->insert_id;
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
    <label>Nombre:   <input type="text"  name="nombre"   required></label><br>
    <label>Apellido: <input type="text"  name="apellido" required></label><br>
    <label>Email:    <input type="email" name="email"    required></label><br>
    <button type="submit">Agregar estudiante</button>
</form>
