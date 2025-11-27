<?php

use Slim\Routing\RouteCollectorProxy;
use App\Controllers\TicketController;
use App\Middleware\AuthMiddleware;
use App\Middleware\AdminMiddleware;
use App\Middleware\GestorMiddleware;

return function ($app) {
    
    // Grupo de rutas API con prefijo /api
    $app->group('/api', function (RouteCollectorProxy $group) {
        
        // Rutas de tickets (requieren autenticación)
        $group->group('/tickets', function (RouteCollectorProxy $ticketGroup) {
            
            // Gestores y admins pueden crear y ver tickets
            $ticketGroup->post('', [TicketController::class, 'crear'])->add(GestorMiddleware::class);
            $ticketGroup->get('', [TicketController::class, 'listar'])->add(GestorMiddleware::class);
            $ticketGroup->get('/{id:[0-9]+}', [TicketController::class, 'obtener'])->add(GestorMiddleware::class);
            
            // Solo administradores pueden gestionar el estado y asignación
            $ticketGroup->put('/{id:[0-9]+}/estado', [TicketController::class, 'actualizarEstado'])->add(AdminMiddleware::class);
            $ticketGroup->put('/{id:[0-9]+}/asignar', [TicketController::class, 'asignar'])->add(AdminMiddleware::class);
            
            // Gestores y admins pueden agregar comentarios
            $ticketGroup->post('/{id:[0-9]+}/comentarios', [TicketController::class, 'agregarComentario'])->add(GestorMiddleware::class);
            
        })->add(AuthMiddleware::class);

    });

    // Ruta de prueba
    $app->get('/', function ($request, $response) {
        $response->getBody()->write(json_encode([
            'service' => 'Microservicio de Tickets',
            'status' => 'running',
            'version' => '1.0.0'
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    });

    // Manejo de rutas no encontradas
    $app->map(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], '/{routes:.+}', function ($request, $response) {
        $response->getBody()->write(json_encode([
            'success' => false,
            'message' => 'Endpoint no encontrado',
            'path' => $request->getUri()->getPath()
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
    });
};