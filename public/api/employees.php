<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($method === 'GET') {
    respond(db()->query(
        "SELECT id, name, agreed_salary, dnevnica FROM employees WHERE active=1 ORDER BY name"
    )->fetchAll());
}

if ($method === 'POST') {
    $d = body();
    if (empty($d['name'])) fail('name required');
    $st = db()->prepare(
        "INSERT INTO employees (name, agreed_salary, dnevnica) VALUES (?, ?, ?)"
    );
    $st->execute([
        trim($d['name']),
        floatval($d['agreed_salary'] ?? 0),
        floatval($d['dnevnica'] ?? 0),
    ]);
    $newId = (int)db()->lastInsertId();
    respond(db()->query("SELECT id, name, agreed_salary, dnevnica FROM employees WHERE id=$newId")->fetch());
}

if ($method === 'PUT') {
    if (!$id) fail('id required');
    $d = body();
    if (empty($d['name'])) fail('name required');
    $st = db()->prepare(
        "UPDATE employees SET name=?, agreed_salary=?, dnevnica=? WHERE id=?"
    );
    $st->execute([
        trim($d['name']),
        floatval($d['agreed_salary'] ?? 0),
        floatval($d['dnevnica'] ?? 0),
        $id,
    ]);
    respond(db()->query("SELECT id, name, agreed_salary, dnevnica FROM employees WHERE id=$id")->fetch());
}

if ($method === 'DELETE') {
    if (!$id) fail('id required');
    // Soft delete — čuva istoriju
    db()->prepare("UPDATE employees SET active=0 WHERE id=?")->execute([$id]);
    respond(['ok' => true]);
}

fail('Method not allowed', 405);
