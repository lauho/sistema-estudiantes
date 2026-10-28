<?php
require_once "config/database.php";
require_once "includes/notas.php";
$conn = getConnection();

$mensaje = "";

$def_nombre = "";
$def_apellido = "";
$def_email = "";
$def_notas = array_fill(0, NOTAS_CANTIDAD, "");

if (!isset($_GET["id"])) {
    header("Location: index.php");
    exit();
}

$id = (int) $_GET["id"];

$resultado = $conn->query(
    "SELECT nombre, apellido, email, notas
         FROM estudiantes
         WHERE id = $id",
);

if ($fila = $resultado->fetch_assoc()) {
    $def_nombre = $fila["nombre"];
    $def_apellido = $fila["apellido"];
    $def_email = $fila["email"];

    $partes = explode(",", (string) ($fila["notas"] ?? ""));
    foreach (array_slice($partes, 0, NOTAS_CANTIDAD) as $i => $valor) {
        $def_notas[$i] = htmlspecialchars(trim($valor));
    }
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
        $notas = validar_notas(leer_notas_post($_POST));

        if (!$notas["ok"]) {
            $mensaje = $notas["mensaje"];
        } else {
            $nombre = $conn->real_escape_string($nombre);
            $apellido = $conn->real_escape_string($apellido);
            $email = $conn->real_escape_string($email);
            $notas = $conn->real_escape_string($notas["valor"]);

            $sql = "UPDATE estudiantes
                    SET nombre = '$nombre', apellido = '$apellido', email = '$email', notas = '$notas'
                    WHERE id = $id";

            if ($conn->query($sql)) {
                $mensaje = "Estudiante actualizado correctamente. ID: " . $id;
            } else {
                $mensaje = "Error: " . $conn->error;
            }
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

    <fieldset>
        <legend>Notas (<?= NOTAS_MIN ?> a <?= NOTAS_MAX ?>)</legend>
        <?php foreach ($def_notas as $i => $valor): ?>
        <label>
            Nota <?= $i + 1 ?>
            <input
                type="number"
                step="0.01"
                min="<?= NOTAS_MIN ?>"
                max="<?= NOTAS_MAX ?>"
                name="notas[<?= $i ?>]"
                value="<?= $valor ?>"
                required
            />
        </label><br>
        <?php endforeach; ?>
    </fieldset>

    <button type="submit">Editar estudiante</button>
</form>
