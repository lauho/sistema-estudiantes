<?php
require_once "config/database.php";
require_once "includes/notas.php";

$mensaje = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $nombre = trim($_POST["nombre"] ?? "");
    $apellido = trim($_POST["apellido"] ?? "");
    $email = trim($_POST["email"] ?? "");

    $notas = validar_notas(leer_notas_post($_POST));

    if (empty($nombre) || empty($apellido) || empty($email)) {
        $mensaje = "Todos los campos son obligatorios.";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $mensaje = "El email no es válido.";
    } elseif (!$notas["ok"]) {
        $mensaje = $notas["mensaje"];
    } else {
        $conn = getConnection();

        $nombre = $conn->real_escape_string($nombre);
        $apellido = $conn->real_escape_string($apellido);
        $email = $conn->real_escape_string($email);
        $notas = $conn->real_escape_string($notas["valor"]);

        $sql = "INSERT INTO estudiantes (nombre, apellido, email, notas)
               VALUES ('$nombre', '$apellido', '$email', '$notas')";

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

    <fieldset>
        <legend>Notas (<?= NOTAS_MIN ?> a <?= NOTAS_MAX ?>)</legend>
        <?php for ($i = 1; $i <= NOTAS_CANTIDAD; $i++): ?>
        <label>
            Nota <?= $i ?>
            <input
                type="number"
                step="0.01"
                min="<?= NOTAS_MIN ?>"
                max="<?= NOTAS_MAX ?>"
                name="notas[<?= $i - 1 ?>]"
                required
            />
        </label><br>
        <?php endfor; ?>
    </fieldset>

    <button type="submit">Agregar estudiante</button>
</form>
