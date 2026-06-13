<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Vraća sve redove ili filtrirane po employee_id i/ili month
    $where  = ['1=1'];
    $params = [];
    if (!empty($_GET['employee_id'])) {
        $where[]  = 'employee_id = ?';
        $params[] = (int)$_GET['employee_id'];
    }
    if (!empty($_GET['month'])) {
        $where[]  = 'month = ?';
        $params[] = $_GET['month'];
    }
    $sql  = 'SELECT employee_id, month, day, state, note FROM attendance WHERE ' . implode(' AND ', $where);
    $st   = db()->prepare($sql);
    $st->execute($params);
    respond($st->fetchAll());
}

if ($method === 'POST') {
    // Upsert jednog dana
    $d = body();
    if (!isset($d['employee_id'], $d['month'], $d['day'])) {
        fail('employee_id, month, day required');
    }
    $state = isset($d['state']) && in_array($d['state'], ['worked', 'off']) ? $d['state'] : null;
    $note  = isset($d['note']) ? trim($d['note']) : '';

    $st = db()->prepare(
        "INSERT INTO attendance (employee_id, month, day, state, note)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE state=VALUES(state), note=VALUES(note)"
    );
    $st->execute([
        (int)$d['employee_id'],
        $d['month'],
        (int)$d['day'],
        $state,
        $note,
    ]);
    respond(['ok' => true]);
}

fail('Method not allowed', 405);
