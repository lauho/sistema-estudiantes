<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"
    >

    <title><?= $titulo ?? "Sistema de estudiantes" ?></title>

    <style>
        .acciones {
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }

        td.acciones-td {
            vertical-align: middle;
        }

        .acciones button,
        .acciones [role="button"] {
            --pico-form-element-spacing-vertical: 0.2rem;
            --pico-form-element-spacing-horizontal: 0.5rem;
            margin-bottom: 0;
            font-size: 0.75rem;
            line-height: 1.2;
        }
    </style>
</head>

<body>
<main class="container">
