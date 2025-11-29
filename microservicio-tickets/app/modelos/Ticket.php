<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    protected $table = 'tickets';

    protected $fillable = [
        'titulo',
        'descripcion',
        'estado',
        'gestor_id',
        'admin_id'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    const ESTADOS = [
        'abierto' => 'Abierto',
        'en_progreso' => 'En Progreso',
        'resuelto' => 'Resuelto',
        'cerrado' => 'Cerrado'
    ];

    public function actividades()
    {
        return $this->hasMany(TicketActividad::class)->orderBy('created_at', 'asc');
    }

    public function getGestorAttribute()
    {
        return $this->gestor_id;
    }

    public function getAdminAttribute()
    {
        return $this->admin_id;
    }

    public function isAbierto()
    {
        return $this->estado === 'abierto';
    }

    public function isCerrado()
    {
        return $this->estado === 'cerrado';
    }

    public function cambiarEstado($nuevoEstado, $userId, $mensaje = null)
    {
        $estadoAnterior = $this->estado;
        $this->estado = $nuevoEstado;
        $this->save();

        $mensajeActividad = $mensaje ?: "Estado cambiado de '{$estadoAnterior}' a '{$nuevoEstado}'";
        
        TicketActividad::create([
            'ticket_id' => $this->id,
            'user_id' => $userId,
            'mensaje' => $mensajeActividad
        ]);

        return $this;
    }

    public function asignarAdmin($adminId, $userId, $adminNombre = null)
    {
        $this->admin_id = $adminId;
        $this->save();

        $nombreMostrar = $adminNombre ? $adminNombre : "ID: {$adminId}";
        TicketActividad::create([
            'ticket_id' => $this->id,
            'user_id' => $userId,
            'mensaje' => "Ticket asignado al administrador {$nombreMostrar}"
        ]);

        return $this;
    }
}