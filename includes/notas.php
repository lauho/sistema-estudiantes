<?php
const NOTAS_CANTIDAD = 4;
const NOTAS_MIN = 1;
const NOTAS_MAX = 10;
const NOTAS_APROBADO = 6;

function validar_notas(array $notas): array {
    if (count($notas) !== NOTAS_CANTIDAD) {
        return [
            "ok" => false,
            "mensaje" => "Se deben enviar " . NOTAS_CANTIDAD . " notas.",
            "valor" => null,
        ];
    }

    $normalizadas = [];

    foreach ($notas as $nota) {
        $nota = trim((string) $nota);

        if ($nota === "" || !is_numeric($nota)) {
            return [
                "ok" => false,
                "mensaje" => "Todas las notas deben ser numéricas.",
                "valor" => null,
            ];
        }

        $nota = (float) $nota;

        if ($nota < NOTAS_MIN || $nota > NOTAS_MAX) {
            return [
                "ok" => false,
                "mensaje" =>
                    "Una de las notas no está en el rango de " .
                    NOTAS_MIN .
                    " a " .
                    NOTAS_MAX .
                    ".",
                "valor" => null,
            ];
        }

        $normalizadas[] = rtrim(rtrim(number_format($nota, 2, ".", ""), "0"), ".");
    }

    return [
        "ok" => true,
        "mensaje" => "",
        "valor" => implode(",", $normalizadas),
    ];
}

function leer_notas_post(array $post): array {
    $notas = [];

    for ($i = 0; $i < NOTAS_CANTIDAD; $i++) {
        $notas[] = $post["notas"][$i] ?? "";
    }

    return $notas;
}

function notas_a_promedio(?string $valor): float {
    if ($valor === null || trim($valor) === "") {
        return 0.0;
    }

    $partes = explode(",", $valor);

    return array_sum(array_map("floatval", $partes)) / NOTAS_CANTIDAD;
}

function notas_a_estado(?string $valor): string {
    return notas_a_promedio($valor) >= NOTAS_APROBADO
        ? "Aprobado"
        : "Desaprobado";
}