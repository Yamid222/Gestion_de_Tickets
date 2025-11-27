<?php

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use App\Models\AuthToken;
use App\Models\User;

class AuthMiddleware
{
    /**
     * Middleware para verificar autenticación
     */
    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        // Obtener el token del header Authorization
        $authHeader = $request->getHeader('Authorization');
        
        if (empty($authHeader)) {
            $response = new \Slim\Psr7\Response();
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Token de autorización requerido'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }

        $token = str_replace('Bearer ', '', $authHeader[0]);

        if (empty($token)) {
            $response = new \Slim\Psr7\Response();
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Token de autorización inválido'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }

        // Validar el token
        $user = AuthToken::getUserByToken($token);

        if (!$user) {
            $response = new \Slim\Psr7\Response();
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Token de autorización inválido o expirado'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }

        // Agregar información del usuario al request
        $request = $request->withAttribute('user', $user);

        return $handler->handle($request);
    }
}

class AdminMiddleware
{
    /**
     * Middleware para verificar que el usuario sea administrador
     */
    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        $user = $request->getAttribute('user');

        if (!$user || !$user->isAdmin()) {
            $response = new \Slim\Psr7\Response();
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Acceso denegado. Se requieren permisos de administrador'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(403);
        }

        return $handler->handle($request);
    }
}