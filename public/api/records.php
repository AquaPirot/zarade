<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($method === 'GET') {
    $where = ['1=1']; $params = [];
    if (!empty($_GET['month'])) { $where[] = 'month = ?'; $params[] = $_GET['month']; }
    $sql = 'SELECT id, employee_id, month, num_dnevnica, num_pergola, note FROM monthly_records WHERE '
           . implode(' AND ', $where) . ' ORDER BY month DESC';
    $st  = db()->prepare($sql);
    $st->execute($params);
    respond($st->fetchAll());
}

if ($method === 'POST') {
    $d = body();
    if (empty($d['employee_id']) || empty($d['month'])) fail('employee_id and month required');
    // Proveri duplikat
    $chk = db()->prepare("SELECT id FROM monthly_records WHERE employee_id=? AND month=?");
    $chk->execute([(int)$d['employee_id'], $d['month']]);
    if ($chk->fetch()) fail('Već postoji obračun za ovog radnika u ovom mesecu', 409);

    $st = db()->prepare(
        "INSERT INTO monthly_records (employee_id, month, num_dnevnica, num_pergola, note)
         VALUES (?, ?, ?, ?, ?)"
    );
    $st->execute([
        (int)$d['employee_id'],
        $d['month'],
        floatval($d['num_dnevnica'] ?? 0),
        floatval($d['num_pergola'] ?? 0),
        trim($d['note'] ?? ''),
    ]);
    $newId = (int)db()->lastInsertId();
    respond(db()->query(
        "SELECT id, employee_id, month, num_dnevnica, num_pergola, note FROM monthly_records WHERE id=$newId"
    )->fetch());
}

if ($method === 'PUT') {
    if (!$id) fail('id required');
    $d = body();
    $st = db()->prepare(
        "UPDATE monthly_records SET num_dnevnica=?, num_pergola=?, note=? WHERE id=?"
    );
    $st->execute([
        floatval($d['num_dnevnica'] ?? 0),
        floatval($d['num_pergola'] ?? 0),
        trim($d['note'] ?? ''),
        $id,
    ]);
    respond(db()->query(
        "SELECT id, employee_id, month, num_dnevnica, num_pergola, note FROM monthly_records WHERE id=$id"
    )->fetch());
}

if ($method === 'DELETE') {
    if (!$id) fail('id required');
    db()->prepare("DELETE FROM monthly_records WHERE id=?")->execute([$id]);
    respond(['ok' => true]);
}

fail('Method not allowed', 405);
