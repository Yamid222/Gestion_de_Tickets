<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    protected $table = 'users';

    /**
     * Campos que se pueden asignar masivamente
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role'
    ];

    /**
     * Campos que deben ocultarse al serializar
     */
    protected $hidden = [
        'password'
    ];

    /**
     * Casting de tipos de datos
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relación: Un usuario puede tener muchos tokens de autenticación
     */
    public function authTokens()
    {
        return $this->hasMany(AuthToken::class);
    }

    /**
     * Obtener el token activo del usuario
     */
    public function getActiveToken()
    {
        return $this->authTokens()->first();
    }

    /**
     * Verificar si el usuario es administrador
     */
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    /**
     * Verificar si el usuario es gestor
     */
    public function isGestor()
    {
        return $this->role === 'gestor';
    }

    /**
     * Hash de la contraseña antes de guardar
     */
    public function setPasswordAttribute($password)
    {
        $this->attributes['password'] = password_hash($password, PASSWORD_DEFAULT);
    }

    /**
     * Verificar contraseña
     * Maneja tanto contraseñas hasheadas como en texto plano (para compatibilidad)
     */
    public function verifyPassword($password)
    {
        // Verificar si la contraseña almacenada está hasheada
        // Las contraseñas hasheadas con password_hash() empiezan con $2y$ o $2a$ o $2b$ (bcrypt)
        // o $argon2i$ o $argon2id$ (argon2)
        $isHashed = preg_match('/^\$2[ayb]\$|\$argon2/', $this->password);
        
        if ($isHashed) {
            // Contraseña hasheada: usar password_verify
            return password_verify($password, $this->password);
        }
        
        // Contraseña en texto plano: comparar directamente
        // Si coincide, hashearla automáticamente para futuras verificaciones
        if ($this->password === $password) {
            // Hashear y guardar para la próxima vez
            // Usamos el mutator setPasswordAttribute que hasheará automáticamente
            $this->attributes['password'] = password_hash($password, PASSWORD_DEFAULT);
            $this->save();
            return true;
        }
        
        return false;
    }
}