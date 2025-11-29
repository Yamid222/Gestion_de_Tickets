<?php

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

    $users = Capsule::table('users')->get();
    
    echo "🔐 Hasheando contraseñas de usuarios...\n\n";
    
    $updated = 0;
    foreach ($users as $user) {
        if (strlen($user->password) < 60) {
            $hashedPassword = password_hash($user->password, PASSWORD_DEFAULT);

            Capsule::table('users')
                ->where('id', $user->id)
                ->update(['password' => $hashedPassword]);

            echo "✅ Usuario '{$user->name}' (ID: {$user->id}) - Contraseña hasheada\n";
            $updated++;
        } else {
            echo "⏭️  Usuario '{$user->name}' (ID: {$user->id}) - Ya tiene contraseña hasheada\n";
        }
    }
    
    echo "\n✨ Proceso completado. $updated usuario(s) actualizado(s).\n";
    echo "📝 Nota: Las contraseñas originales eran 'password123' para todos los usuarios de prueba.\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

