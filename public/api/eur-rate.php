<?php
// ============================================================
//  PROHORECA — Srednji kurs EUR sa Narodne banke Srbije
//  GET /api/eur-rate.php  →  { "rate": 117.2034, "source": "NBS" }
// ============================================================
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

function fetch_url($url) {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT        => 8,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_USERAGENT      => 'Mozilla/5.0',
        ]);
        $data = curl_exec($ch);
        $ok   = ($data !== false && curl_getinfo($ch, CURLINFO_HTTP_CODE) < 400);
        curl_close($ch);
        if ($ok) return $data;
    }
    $ctx = stream_context_create(['http' => ['timeout' => 8], 'ssl' => ['verify_peer' => false, 'verify_peer_name' => false]]);
    $data = @file_get_contents($url, false, $ctx);
    return $data !== false ? $data : null;
}

// 1) NBS zvanična kursna lista (XML)
$xml = fetch_url('https://www.nbs.rs/kursna-lista/v2/today.xml');
if ($xml) {
    $sx = @simplexml_load_string($xml);
    if ($sx !== false) {
        foreach ($sx->xpath('//*[local-name()="ExchangeRate"]') ?: [] as $row) {
            $code = (string)($row->CurrencyCodeAlfaChar ?? $row->{'CurrencyCodeAlfaChar'} ?? '');
            if (strtoupper($code) === 'EUR') {
                $mid = (float)str_replace(',', '.', (string)($row->MiddleRate ?? ''));
                if ($mid > 0) {
                    echo json_encode(['rate' => round($mid, 4), 'source' => 'NBS']);
                    exit;
                }
            }
        }
    }
}

// 2) Rezerva — open.er-api.com
$json = fetch_url('https://open.er-api.com/v6/latest/EUR');
if ($json) {
    $d = json_decode($json, true);
    if (!empty($d['rates']['RSD'])) {
        echo json_encode(['rate' => round((float)$d['rates']['RSD'], 4), 'source' => 'er-api']);
        exit;
    }
}

http_response_code(502);
echo json_encode(['error' => 'Kurs trenutno nije dostupan']);
