<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuthToken extends Model
{
    protected $table = 'auth_tokens';

    /**
     * Campos que se pueden asignar masivamente
     */
    protected $fillable = [
        'user_id',
        'token'
    ];

    /**
     * Casting de tipos de datos
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relación: Un token pertenece a un usuario
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Generar un token aleatorio único
     */
    public static function generateToken()
    {
        return bin2hex(random_bytes(32)); // 64 caracteres hexadecimales
    }

    /**
     * Crear un token para un usuario específico
     */
    public static function createTokenForUser($userId)
    {
        // Eliminar tokens existentes del usuario
        self::where('user_id', $userId)->delete();
        
        // Crear nuevo token
        return self::create([
            'user_id' => $userId,
            'token' => self::generateToken()
        ]);
    }

    /**
     * Validar y obtener usuario por token
     */
    public static function getUserByToken($token)
    {
        $authToken = self::where('token', $token)->first();
        
        if (!$authToken) {
            return null;
        }

        return $authToken->user;
    }
}