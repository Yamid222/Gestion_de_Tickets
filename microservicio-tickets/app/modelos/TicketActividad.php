<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketActividad extends Model
{
    protected $table = 'ticket_actividad';

    /**
     * Campos que se pueden asignar masivamente
     */
    protected $fillable = [
        'ticket_id',
        'user_id',
        'mensaje'
    ];

    /**
     * Casting de tipos de datos
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relación: Actividad pertenece a un ticket
     */
    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    /**
     * Obtener información del usuario (necesitaremos consulta externa)
     * Por ahora retornamos el ID, en implementación real haríamos llamada HTTP al microservicio de usuarios
     */
    public function getUserAttribute()
    {
        return $this->user_id;
    }

    /**
     * Agregar comentario a un ticket
     */
    public static function agregarComentario($ticketId, $userId, $mensaje)
    {
        return self::create([
            'ticket_id' => $ticketId,
            'user_id' => $userId,
            'mensaje' => $mensaje
        ]);
    }
}