<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketActividad extends Model
{
    protected $table = 'ticket_actividad';

    protected $fillable = [
        'ticket_id',
        'user_id',
        'mensaje'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function getUserAttribute()
    {
        return $this->user_id;
    }

    public static function agregarComentario($ticketId, $userId, $mensaje)
    {
        return self::create([
            'ticket_id' => $ticketId,
            'user_id' => $userId,
            'mensaje' => $mensaje
        ]);
    }
}