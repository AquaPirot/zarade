<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($method === 'GET') {
    $where = ['1=1']; $params = [];
    if (!empty($_GET['employee_id'])) { $where[] = 'employee_id = ?'; $params[] = (int)$_GET['employee_id']; }
    if (!empty($_GET['month']))       { $where[] = 'month = ?';       $params[] = $_GET['month']; }
    $sql = 'SELECT id, employee_id, month, amount, payment_date, method, note FROM payments WHERE '
           . implode(' AND ', $where) . ' ORDER BY payment_date DESC, id DESC';
    $st  = db()->prepare($sql);
    $st->execute($params);
    respond($st->fetchAll());
}

if ($method === 'POST') {
    $d = body();
    if (empty($d['employee_id']) || !isset($d['amount'])) fail('employee_id and amount required');
    $methods = ['cash', 'bank', 'other'];
    $m       = in_array($d['method'] ?? '', $methods) ? $d['method'] : 'cash';
    $date    = !empty($d['date']) ? $d['date'] : date('Y-m-d');

    $st = db()->prepare(
        "INSERT INTO payments (employee_id, month, amount, payment_date, method, note)
         VALUES (?, ?, ?, ?, ?, ?)"
    );
    $st->execute([
        (int)$d['employee_id'],
        $d['month'] ?? date('Y-m'),
        floatval($d['amount']),
        $date,
        $m,
        trim($d['note'] ?? ''),
    ]);
    $newId = (int)db()->lastInsertId();
    respond(db()->query(
        "SELECT id, employee_id, month, amount, payment_date, method, note FROM payments WHERE id=$newId"
    )->fetch());
}

if ($method === 'DELETE') {
    if (!$id) fail('id required');
    db()->prepare("DELETE FROM payments WHERE id=?")->execute([$id]);
    respond(['ok' => true]);
}

fail('Method not allowed', 405);
