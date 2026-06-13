<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = db()->query("SELECT key_name, value FROM settings")->fetchAll();
    $out  = [];
    foreach ($rows as $r) $out[$r['key_name']] = $r['value'];
    respond($out);
}

if ($method === 'POST') {
    $d = body();
    if (empty($d['key_name'])) fail('key_name required');
    $st = db()->prepare(
        "INSERT INTO settings (key_name, value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value)"
    );
    $st->execute([$d['key_name'], $d['value'] ?? '']);
    respond(['ok' => true]);
}

fail('Method not allowed', 405);
