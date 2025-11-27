<?php

// Script para probar la conexión a la base de datos
require 'microservicio-usuarios/vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as Capsule;

try {
    $capsule = new Capsule;

    $capsule->addConnection([
        'driver'    => 'mysql',
        'host'      => '127.0.0.1',
        'database'  => 'soporte_tickets',
        'username'  => 'root',
        'password'  => '',
        'charset'   => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'prefix'    => '',
        'port'      => '3306',
    ]);

    $capsule->setAsGlobal();
    $capsule->bootEloquent();

    // Probar la conexión
    $users = Capsule::table('users')->count();
    $tickets = Capsule::table('tickets')->count();
    
    echo "✅ Conexión exitosa a la base de datos!\n";
    echo "👤 Usuarios en la BD: $users\n";
    echo "🎫 Tickets en la BD: $tickets\n";
    
} catch (Exception $e) {
    echo "❌ Error de conexión: " . $e->getMessage() . "\n";
}