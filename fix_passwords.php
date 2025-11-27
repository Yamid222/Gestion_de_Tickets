<?php

/**
 * Script para hashear las contraseñas de usuarios existentes en la base de datos
 * Ejecutar este script una vez después de insertar usuarios con contraseñas en texto plano
 */

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

    // Obtener todos los usuarios
    $users = Capsule::table('users')->get();
    
    echo "🔐 Hasheando contraseñas de usuarios...\n\n";
    
    $updated = 0;
    foreach ($users as $user) {
        // Verificar si la contraseña ya está hasheada (las contraseñas hasheadas tienen 60 caracteres)
        if (strlen($user->password) < 60) {
            // Hashear la contraseña
            $hashedPassword = password_hash($user->password, PASSWORD_DEFAULT);
            
            // Actualizar en la base de datos
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

