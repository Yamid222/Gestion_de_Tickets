<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    protected $table = 'tickets';

    /**
     * Campos que se pueden asignar masivamente
     */
    protected $fillable = [
        'titulo',
        'descripcion',
        'estado',
        'gestor_id',
        'admin_id'
    ];

    /**
     * Casting de tipos de datos
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Estados válidos para los tickets
     */
    const ESTADOS = [
        'abierto' => 'Abierto',
        'en_progreso' => 'En Progreso',
        'resuelto' => 'Resuelto',
        'cerrado' => 'Cerrado'
    ];

    /**
     * Relación: Actividades del ticket
     */
    public function actividades()
    {
        return $this->hasMany(TicketActividad::class)->orderBy('created_at', 'asc');
    }

    /**
     * Obtener el gestor (necesitaremos consulta externa al microservicio de usuarios)
     * Por ahora retornamos el ID, pero en implementación real haríamos llamada HTTP
     */
    public function getGestorAttribute()
    {
        return $this->gestor_id;
    }

    /**
     * Obtener el admin (necesitaremos consulta externa al microservicio de usuarios)
     * Por ahora retornamos el ID, pero en implementación real haríamos llamada HTTP
     */
    public function getAdminAttribute()
    {
        return $this->admin_id;
    }

    /**
     * Verificar si el ticket está abierto
     */
    public function isAbierto()
    {
        return $this->estado === 'abierto';
    }

    /**
     * Verificar si el ticket está cerrado
     */
    public function isCerrado()
    {
        return $this->estado === 'cerrado';
    }

    /**
     * Cambiar estado del ticket y registrar actividad
     */
    public function cambiarEstado($nuevoEstado, $userId, $mensaje = null)
    {
        $estadoAnterior = $this->estado;
        $this->estado = $nuevoEstado;
        $this->save();

        // Registrar actividad
        $mensajeActividad = $mensaje ?: "Estado cambiado de '{$estadoAnterior}' a '{$nuevoEstado}'";
        
        TicketActividad::create([
            'ticket_id' => $this->id,
            'user_id' => $userId,
            'mensaje' => $mensajeActividad
        ]);

        return $this;
    }

    /**
     * Asignar ticket a un administrador
     */
    public function asignarAdmin($adminId, $userId)
    {
        $this->admin_id = $adminId;
        $this->save();

        // Registrar actividad
        TicketActividad::create([
            'ticket_id' => $this->id,
            'user_id' => $userId,
            'mensaje' => "Ticket asignado al administrador ID: {$adminId}"
        ]);

        return $this;
    }
}