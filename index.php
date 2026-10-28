<?php
require_once "config/database.php";
require_once "includes/notas.php";
$conn = getConnection();

$busqueda = trim($_GET["q"] ?? "");
$estado = trim($_GET["estado"] ?? "");
$activo = $_GET["activo"] ?? "1";

if ($estado !== "Aprobado" && $estado !== "Desaprobado") {
    $estado = "";
}

if ($activo !== "0" && $activo !== "1" && $activo !== "") {
    $activo = "1";
}

$condiciones = [];

if ($activo !== "") {
    $condiciones[] = "activo = $activo";
}

if ($busqueda) {
    $b = $conn->real_escape_string($busqueda);
    $condiciones[] = "(nombre LIKE '%$b%' OR apellido LIKE '%$b%')";
}

$where = $condiciones ? "WHERE " . implode(" AND ", $condiciones) : "";
$resultado = $conn->query(
    "SELECT * FROM estudiantes $where ORDER BY apellido",
);
$filas = $resultado->fetch_all(MYSQLI_ASSOC);

if ($estado !== "") {
    $filas = array_filter(
        $filas,
        fn($fila) => ($fila["notas"] ?? "") !== "" &&
            notas_a_estado($fila["notas"]) === $estado,
    );
}

require_once "includes/header.php";
?>

<h1>Estudiantes</h1>

<form method="get">
    <input type="search" name="q" value="<?= htmlspecialchars(
        $busqueda,
    ) ?>" placeholder="Buscar por nombre o apellido">

    <select name="estado" onchange="this.form.submit()">
        <option value="" <?= $estado === "" ? "selected" : "" ?>>
            Todos los estados
        </option>
        <option value="Aprobado" <?= $estado === "Aprobado" ? "selected" : "" ?>>
            Aprobado
        </option>
        <option
            value="Desaprobado"
            <?= $estado === "Desaprobado" ? "selected" : "" ?>
        >
            Desaprobado
        </option>
    </select>

    <select name="activo" onchange="this.form.submit()">
        <option value="1" <?= $activo === "1" ? "selected" : "" ?>>
            Solo activos
        </option>
        <option value="0" <?= $activo === "0" ? "selected" : "" ?>>
            Solo inactivos
        </option>
        <option value="" <?= $activo === "" ? "selected" : "" ?>>
            Activos e inactivos
        </option>
    </select>

    <button type="submit">Filtrar</button>
</form>

<?php if ($busqueda || $estado || $activo !== "1"): ?>
  <a href="?">Ver todos</a>
<?php endif; ?>

<table class="striped">
    <thead>
    <tr>
        <th scope="col">Nombre</th>
        <th scope="col">Apellido</th>
        <th scope="col">Email</th>
        <th scope="col">Notas</th>
        <th scope="col">Promedio</th>
        <th scope="col">Acciones</th>
    </tr>
    </thead>

    <tbody>
        <?php if (!$filas): ?>
        <tr>
            <td colspan="6">Sin resultados</td>
        </tr>
        <?php endif; ?>

        <?php foreach ($filas as $fila): ?>
        <tr>
            <td><?= htmlspecialchars($fila["nombre"]) ?></td>
            <td><?= htmlspecialchars($fila["apellido"]) ?></td>
            <td><?= htmlspecialchars($fila["email"]) ?></td>
            <td>
                <?php if (($fila["notas"] ?? "") !== ""): ?>
                    <?= htmlspecialchars(str_replace(",", ", ", $fila["notas"])) ?>
                <?php else: ?>
                    -
                <?php endif; ?>
            </td>
            <td>
                <?php if (($fila["notas"] ?? "") !== ""): ?>
                    <?= htmlspecialchars(number_format(notas_a_promedio($fila["notas"]), 2)) ?>
                    (<?= htmlspecialchars(notas_a_estado($fila["notas"])) ?>)
                <?php else: ?>
                    -
                <?php endif; ?>
            </td>

            <td class="acciones-td">
                <div class="acciones">
                    <a role="button" href="editar.php?id=<?= $fila[
                        "id"
                    ] ?>">Editar</a>

                    <?php if ((int) $fila["activo"] === 0): ?>
                        <a role="button" href="reactivar.php?id=<?= $fila[
                            "id"
                        ] ?>">Reactivar</a>
                    <?php else: ?>
                        <a
                            role="button"
                            class="secondary"
                            href="eliminar.php?id=<?= $fila["id"] ?>"
                            onclick="return confirm('¿Eliminar este estudiante?')"
                        >
                            Eliminar
                        </a>
                    <?php endif; ?>
                </div>
            </td>
        </tr>
        <?php endforeach; ?>
    </tbody>
</table>

<p>Total: <?= count($filas) ?> estudiantes</p>

<a href="crear.php">Crear nuevo</a>
