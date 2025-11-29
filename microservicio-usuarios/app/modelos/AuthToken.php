<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuthToken extends Model
{
    protected $table = 'auth_tokens';

    protected $fillable = [
        'user_id',
        'token'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function generateToken()
    {
        return bin2hex(random_bytes(32));
    }

    public static function createTokenForUser($userId)
    {
        self::where('user_id', $userId)->delete();
        
        return self::create([
            'user_id' => $userId,
            'token' => self::generateToken()
        ]);
    }

    public static function getUserByToken($token)
    {
        $authToken = self::where('token', $token)->first();
        
        if (!$authToken) {
            return null;
        }

        return $authToken->user;
    }
}