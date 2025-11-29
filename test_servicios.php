<?php

echo "🔍 Verificando microservicios...\n\n";

echo "1. Microservicio de Usuarios (http://localhost:8000):\n";
$ch = curl_init('http://localhost:8000/');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo "   ❌ Error: $error\n";
    echo "   ⚠️  El microservicio de usuarios NO está corriendo en el puerto 8000\n";
} elseif ($httpCode === 200) {
    echo "   ✅ Microservicio de usuarios está corriendo (HTTP $httpCode)\n";
    $data = json_decode($response, true);
    if ($data) {
        echo "   📋 Respuesta: " . ($data['service'] ?? 'OK') . "\n";
    }
} else {
    echo "   ⚠️  HTTP Code: $httpCode\n";
}

echo "\n";

echo "2. Microservicio de Tickets (http://localhost:8001):\n";
$ch = curl_init('http://localhost:8001/');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo "   ❌ Error: $error\n";
    echo "   ⚠️  El microservicio de tickets NO está corriendo en el puerto 8001\n";
} elseif ($httpCode === 200) {
    echo "   ✅ Microservicio de tickets está corriendo (HTTP $httpCode)\n";
    $data = json_decode($response, true);
    if ($data) {
        echo "   📋 Respuesta: " . ($data['service'] ?? 'OK') . "\n";
    }
} else {
    echo "   ⚠️  HTTP Code: $httpCode\n";
}

echo "\n";

echo "3. Endpoint de validación de token:\n";
$ch = curl_init('http://localhost:8000/api/auth/validate-token');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer test_token',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo "   ❌ Error: $error\n";
} else {
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    if (strpos($response, '<!doctype') !== false || strpos($response, '<html') !== false) {
        echo "   ❌ El endpoint devuelve HTML en lugar de JSON\n";
        echo "   📄 Respuesta: " . substr($response, 0, 200) . "...\n";
    } else {
        echo "   ✅ El endpoint devuelve JSON (HTTP $httpCode)\n";
        $data = json_decode($response, true);
        if ($data) {
            echo "   📋 Mensaje: " . ($data['message'] ?? 'OK') . "\n";
        }
    }
}

echo "\n✨ Verificación completada.\n";
echo "\n💡 Si algún servicio no está corriendo, ejecuta:\n";
echo "   - start_usuarios.bat (puerto 8000)\n";
echo "   - start_tickets.bat (puerto 8001)\n";

