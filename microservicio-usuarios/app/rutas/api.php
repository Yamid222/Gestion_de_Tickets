<?php

use Slim\Routing\RouteCollectorProxy;
use App\Controllers\AuthController;
use App\Controllers\UserController;
use App\Middleware\AuthMiddleware;
use App\Middleware\AdminMiddleware;

return function ($app) {
    
    $app->group('/api', function (RouteCollectorProxy $group) {
        
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

        $group->group('/usuarios', function (RouteCollectorProxy $userGroup) {
            
            $userGroup->post('', [UserController::class, 'crear'])->add(AdminMiddleware::class);
            $userGroup->get('', [UserController::class, 'listar'])->add(AdminMiddleware::class);
            $userGroup->get('/{id:[0-9]+}', [UserController::class, 'obtener'])->add(AdminMiddleware::class);
            $userGroup->put('/{id:[0-9]+}', [UserController::class, 'actualizar'])->add(AdminMiddleware::class);
            $userGroup->delete('/{id:[0-9]+}', [UserController::class, 'eliminar'])->add(AdminMiddleware::class);
            
        })->add(AuthMiddleware::class);

    });

    $app->get('/', function ($request, $response) {
        $response->getBody()->write(json_encode([
            'service' => 'Microservicio de Usuarios',
            'status' => 'running',
            'version' => '1.0.0'
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    });

    $app->map(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], '/{routes:.+}', function ($request, $response) {
        $response->getBody()->write(json_encode([
            'success' => false,
            'message' => 'Endpoint no encontrado',
            'path' => $request->getUri()->getPath()
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
    });
};