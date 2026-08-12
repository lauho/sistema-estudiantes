<?php
require_once "config/database.php";
$conn = getConnection();

$busqueda = trim($_GET["q"] ?? "");

if ($busqueda) {
    $b = $conn->real_escape_string($busqueda);
    $sql = "SELECT * FROM estudiantes
            WHERE activo = 1
            AND (nombre LIKE '%$b%' OR apellido LIKE '%$b%')
            ORDER BY apellido";
} else {
    $sql = "SELECT * FROM estudiantes WHERE activo = 1 ORDER BY apellido";
}

$resultado = $conn->query($sql);

require_once "includes/header.php";
?>

<h1>Estudiantes</h1>


<form method="get">
    <input type="search" name="q" value="<?= htmlspecialchars(
        $busqueda,
    ) ?>" placeholder="Buscar por nombre o apellido">
</form>

<?php if ($busqueda): ?>
  <a href="?">Ver todos</a>
<?php endif; ?>

<table>
    <thead>
    <tr>
        <th>Nombre</th>
        <th>Apellido</th>
        <th>Email</th>
        <th>Acciones</th>
    </tr>
    </thead>

    <tbody>
        <?php while ($fila = $resultado->fetch_assoc()): ?>
        <tr>
            <td><?= htmlspecialchars($fila["nombre"]) ?></td>
            <td><?= htmlspecialchars($fila["apellido"]) ?></td>
            <td><?= htmlspecialchars($fila["email"]) ?></td>

            <td>
                <a href="editar.php?id=<?= $fila["id"] ?>">Editar</a>
                <a href="eliminar.php?id=<?= $fila[
                    "id"
                ] ?>" onclick="return confirm('¿Eliminar este estudiante?')">Eliminar</a>
            </td>
        </tr>
        <?php endwhile; ?>
    </tbody>
</table>

<p>Total: <?= $resultado->num_rows ?> estudiantes</p>

<a href="crear.php">Crear nuevo</a>
