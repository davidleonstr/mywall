<?php /** @var string $content */ ?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($title ?? 'Page Title') ?></title>
    <link rel="stylesheet" href="/src/css/home.css">
    <script type="module" defer src="/src/js/home.js"></script>
    <link rel="icon" href="/src/assets/app-icon.svg" type="image/svg+xml">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=JetBrains+Mono&display=swap" rel="stylesheet">
</head>
<body id="root">
    <?= $content ?>
</body>
</html>