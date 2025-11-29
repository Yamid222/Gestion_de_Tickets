<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    protected $table = 'users';

    protected $fillable = [
        'name',
        'email',
        'password',
        'role'
    ];

    protected $hidden = [
        'password'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function authTokens()
    {
        return $this->hasMany(AuthToken::class);
    }

    public function getActiveToken()
    {
        return $this->authTokens()->first();
    }

    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function isGestor()
    {
        return $this->role === 'gestor';
    }

    public function setPasswordAttribute($password)
    {
        $this->attributes['password'] = password_hash($password, PASSWORD_DEFAULT);
    }

    public function verifyPassword($password)
    {
        $isHashed = preg_match('/^\$2[ayb]\$|\$argon2/', $this->password);
        
        if ($isHashed) {
            return password_verify($password, $this->password);
        }
        
        if ($this->password === $password) {
            $this->attributes['password'] = password_hash($password, PASSWORD_DEFAULT);
            $this->save();
            return true;
        }
        
        return false;
    }
}