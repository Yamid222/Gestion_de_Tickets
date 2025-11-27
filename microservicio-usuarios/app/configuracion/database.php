<?php

use Illuminate\Database\Capsule\Manager as Capsule;

// Configuración de la conexión a la base de datos
$capsule = new Capsule;

$capsule->addConnection([
    'driver'    => 'mysql',
    'host'      => '127.0.0.1',        // Host de MySQL
    'database'  => 'soporte_tickets',  // Nombre de tu base de datos
    'username'  => 'root',             // Tu usuario de MySQL
    'password'  => '',                 // Tu contraseña de MySQL (ajusta si tienes una)
    'charset'   => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix'    => '',
    'port'      => '3306',             // Puerto de MySQL
]);

// Hacer que Eloquent esté disponible globalmente
$capsule->setAsGlobal();

// Inicializar Eloquent
$capsule->bootEloquent();

return $capsule;