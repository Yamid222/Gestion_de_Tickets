<?php

use Slim\Routing\RouteCollectorProxy;
use App\Controllers\AuthController;
use App\Controllers\UserController;
use App\Middleware\AuthMiddleware;
use App\Middleware\AdminMiddleware;

return function ($app) {
    
    // Grupo de rutas API con prefijo /api
    $app->group('/api', function (RouteCollectorProxy $group) {
        
        // Rutas de autenticación (no requieren token)
        $group->group('/auth', function (RouteCollectorProxy $authGroup) {
            
            $authGroup->post('/registro', function ($request, $response, $args) {
                $controller = new AuthController();
                return $controller->registro($request, $response);
            });

            $authGroup->post('/login', function ($request, $response, $args) {
                $controller = new AuthController();
                return $controller->login($request, $response);
            });

            $authGroup->post('/logout', function ($request, $response, $args) {
                $controller = new AuthController();
                return $controller->logout($request, $response);
            });

            $authGroup->get('/validate-token', function ($request, $response, $args) {
                $controller = new AuthController();
                return $controller->validateToken($request, $response);
            });
        });

        // Rutas de usuarios (requieren autenticación)
        $group->group('/usuarios', function (RouteCollectorProxy $userGroup) {
            
            // Solo administradores pueden gestionar usuarios
            $userGroup->get('', [UserController::class, 'listar'])->add(AdminMiddleware::class);
            $userGroup->get('/{id:[0-9]+}', [UserController::class, 'obtener'])->add(AdminMiddleware::class);
            $userGroup->put('/{id:[0-9]+}', [UserController::class, 'actualizar'])->add(AdminMiddleware::class);
            $userGroup->delete('/{id:[0-9]+}', [UserController::class, 'eliminar'])->add(AdminMiddleware::class);
            
        })->add(AuthMiddleware::class);

    });

    // Ruta de prueba
    $app->get('/', function ($request, $response) {
        $response->getBody()->write(json_encode([
            'service' => 'Microservicio de Usuarios',
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