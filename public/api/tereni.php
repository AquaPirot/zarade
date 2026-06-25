<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : 0;

// Učitaj radnike (assignacije) za dati teren
function teren_workers($tid) {
    $st = db()->prepare(
        "SELECT tw.employee_id, tw.systems, e.name
         FROM teren_workers tw JOIN employees e ON e.id = tw.employee_id
         WHERE tw.teren_id = ? ORDER BY e.name"
    );
    $st->execute([$tid]);
    return $st->fetchAll();
}

// Vrati jedan teren sa ugnježdenim radnicima
function teren_full($tid) {
    $st = db()->prepare("SELECT id, teren_date, month, location, note FROM tereni WHERE id = ?");
    $st->execute([$tid]);
    $t = $st->fetch();
    if ($t) $t['workers'] = teren_workers($tid);
    return $t;
}

// Upiši assignacije radnika za teren (briše stare pa upisuje nove)
function save_workers($tid, $workers) {
    db()->prepare("DELETE FROM teren_workers WHERE teren_id = ?")->execute([$tid]);
    if (!is_array($workers)) return;
    $ins = db()->prepare(
        "INSERT INTO teren_workers (teren_id, employee_id, systems) VALUES (?, ?, ?)"
    );
    foreach ($workers as $w) {
        if (empty($w['employee_id'])) continue;
        $ins->execute([$tid, (int)$w['employee_id'], floatval($w['systems'] ?? 0)]);
    }
}

if ($method === 'GET') {
    $where = ['1=1']; $params = [];
    if (!empty($_GET['month'])) { $where[] = 'month = ?'; $params[] = $_GET['month']; }
    $sql = 'SELECT id FROM tereni WHERE ' . implode(' AND ', $where) . ' ORDER BY teren_date DESC, id DESC';
    $st  = db()->prepare($sql);
    $st->execute($params);
    $out = [];
    foreach ($st->fetchAll() as $row) { $out[] = teren_full((int)$row['id']); }
    respond($out);
}

if ($method === 'POST') {
    $d = body();
    if (empty($d['teren_date'])) fail('teren_date required');
    $date  = $d['teren_date'];
    $month = substr($date, 0, 7);
    $st = db()->prepare(
        "INSERT INTO tereni (teren_date, month, location, note) VALUES (?, ?, ?, ?)"
    );
    $st->execute([$date, $month, trim($d['location'] ?? ''), trim($d['note'] ?? '')]);
    $newId = (int)db()->lastInsertId();
    save_workers($newId, $d['workers'] ?? []);
    respond(teren_full($newId));
}

if ($method === 'PUT') {
    if (!$id) fail('id required');
    $d = body();
    if (empty($d['teren_date'])) fail('teren_date required');
    $date  = $d['teren_date'];
    $month = substr($date, 0, 7);
    $st = db()->prepare(
        "UPDATE tereni SET teren_date=?, month=?, location=?, note=? WHERE id=?"
    );
    $st->execute([$date, $month, trim($d['location'] ?? ''), trim($d['note'] ?? ''), $id]);
    save_workers($id, $d['workers'] ?? []);
    respond(teren_full($id));
}

if ($method === 'DELETE') {
    if (!$id) fail('id required');
    db()->prepare("DELETE FROM tereni WHERE id=?")->execute([$id]);
    respond(['ok' => true]);
}

fail('Method not allowed', 405);
