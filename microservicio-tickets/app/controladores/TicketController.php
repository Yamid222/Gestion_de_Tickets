<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Ticket;
use App\Models\TicketActividad;

class TicketController
{
    /**
     * Crear nuevo ticket (solo gestores)
     */
    public function crear(Request $request, Response $response, array $args = [])
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);

            // Validaciones básicas
            if (empty($data['titulo']) || empty($data['descripcion']) || empty($data['gestor_id'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Título, descripción y gestor_id son obligatorios'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            // Crear el ticket
            $ticket = Ticket::create([
                'titulo' => $data['titulo'],
                'descripcion' => $data['descripcion'],
                'estado' => 'abierto',
                'gestor_id' => $data['gestor_id']
            ]);

            // Registrar actividad inicial
            TicketActividad::create([
                'ticket_id' => $ticket->id,
                'user_id' => $data['gestor_id'],
                'mensaje' => 'Ticket creado: ' . $data['titulo']
            ]);

            // Cargar actividades para la respuesta
            $ticket->load('actividades');

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Ticket creado exitosamente',
                'data' => $ticket
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    /**
     * Listar tickets con filtros opcionales
     */
    public function listar(Request $request, Response $response, array $args = [])
    {
        try {
            $queryParams = $request->getQueryParams();
            
            $query = Ticket::with('actividades');

            // Filtros opcionales
            if (!empty($queryParams['estado'])) {
                $query->where('estado', $queryParams['estado']);
            }

            if (!empty($queryParams['gestor_id'])) {
                $query->where('gestor_id', $queryParams['gestor_id']);
            }

            if (!empty($queryParams['admin_id'])) {
                $query->where('admin_id', $queryParams['admin_id']);
            }

            // Tickets sin asignar (admin_id es NULL)
            if (!empty($queryParams['sin_asignar'])) {
                $query->whereNull('admin_id');
            }

            // Solo tickets del gestor si se especifica
            if (!empty($queryParams['solo_gestor']) && !empty($queryParams['user_id'])) {
                $query->where('gestor_id', $queryParams['user_id']);
            }

            // Búsqueda por texto (título o descripción)
            if (!empty($queryParams['buscar'])) {
                $buscar = $queryParams['buscar'];
                $query->where(function($q) use ($buscar) {
                    $q->where('titulo', 'LIKE', "%{$buscar}%")
                      ->orWhere('descripcion', 'LIKE', "%{$buscar}%");
                });
            }

            $tickets = $query->orderBy('created_at', 'desc')->get();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $tickets
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    /**
     * Obtener ticket por ID
     */
    public function obtener(Request $request, Response $response, array $args)
    {
        try {
            $ticketId = $args['id'];
            
            $ticket = Ticket::with('actividades')->find($ticketId);

            if (!$ticket) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Ticket no encontrado'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $ticket
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    /**
     * Actualizar estado del ticket (solo administradores)
     */
    public function actualizarEstado(Request $request, Response $response, array $args)
    {
        try {
            $ticketId = $args['id'];
            $data = json_decode($request->getBody()->getContents(), true);

            if (empty($data['estado']) || empty($data['user_id'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Estado y user_id son obligatorios'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            $ticket = Ticket::find($ticketId);

            if (!$ticket) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Ticket no encontrado'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            // Validar estado
            if (!array_key_exists($data['estado'], Ticket::ESTADOS)) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Estado no válido'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            $mensaje = $data['mensaje'] ?? null;
            $ticket->cambiarEstado($data['estado'], $data['user_id'], $mensaje);
            
            $ticket->load('actividades');

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Estado del ticket actualizado',
                'data' => $ticket
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    /**
     * Asignar ticket a administrador
     */
    public function asignar(Request $request, Response $response, array $args)
    {
        try {
            $ticketId = $args['id'];
            $data = json_decode($request->getBody()->getContents(), true);

            if (empty($data['admin_id']) || empty($data['user_id'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'admin_id y user_id son obligatorios'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            $ticket = Ticket::find($ticketId);

            if (!$ticket) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Ticket no encontrado'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $adminNombre = $data['admin_nombre'] ?? null;

            $ticket->asignarAdmin($data['admin_id'], $data['user_id'], $adminNombre);
            $ticket->load('actividades');

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Ticket asignado exitosamente',
                'data' => $ticket
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    /**
     * Agregar comentario al ticket
     */
    public function agregarComentario(Request $request, Response $response, array $args)
    {
        try {
            $ticketId = $args['id'];
            $data = json_decode($request->getBody()->getContents(), true);

            if (empty($data['mensaje']) || empty($data['user_id'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Mensaje y user_id son obligatorios'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            $ticket = Ticket::find($ticketId);

            if (!$ticket) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Ticket no encontrado'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            TicketActividad::agregarComentario($ticketId, $data['user_id'], $data['mensaje']);
            
            $ticket->load('actividades');

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Comentario agregado exitosamente',
                'data' => $ticket
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
}