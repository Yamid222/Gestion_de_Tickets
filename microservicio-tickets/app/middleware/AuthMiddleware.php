<?php

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

class AuthMiddleware
{
    private $userServiceUrl;

    public function __construct()
    {
        $this->userServiceUrl = 'http://localhost:8000/api';
    }

    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        $authHeader = $request->getHeader('Authorization');
        
        if (empty($authHeader)) {
            $response = new \Slim\Psr7\Response();
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Token de autorización requerido'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }

        $token = $authHeader[0];
        
        $token = str_replace('Bearer ', '', $token);

        if (empty($token)) {
            $response = new \Slim\Psr7\Response();
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Token de autorización inválido'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }

        $userInfo = $this->validateTokenWithUserService($token);

        if (!$userInfo) {
            $response = new \Slim\Psr7\Response();
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Token de autorización inválido o expirado'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }

        $request = $request->withAttribute('user', $userInfo);

        return $handler->handle($request);
    }

    private function validateTokenWithUserService($token)
    {
        try {
            $ch = curl_init();
            $url = $this->userServiceUrl . '/auth/validate-token';
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $token,
                'Content-Type: application/json'
            ]);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);

            if ($curlError) {
                error_log("Error CURL al validar token: " . $curlError);
            }

            if (strpos($response, '<!doctype') !== false || strpos($response, '<html') !== false) {
                error_log("El microservicio de usuarios devolvió HTML en lugar de JSON. URL: $url");
                error_log("Respuesta: " . substr($response, 0, 500));
                return null;
            }

            if ($httpCode === 200 && $response) {
                $data = json_decode($response, true);
                if ($data && isset($data['success']) && $data['success']) {
                    return $data['data']['user'];
                }
            }

            error_log("Token validation failed. HTTP Code: $httpCode, URL: $url");
            error_log("Response: " . substr($response, 0, 200));

            return null;
        } catch (\Exception $e) {
            error_log("Exception al validar token: " . $e->getMessage());
            return null;
        }
    }
}

class AdminMiddleware
{
    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        $user = $request->getAttribute('user');

        if (!$user || $user['role'] !== 'admin') {
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

class GestorMiddleware
{
    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        $user = $request->getAttribute('user');

        if (!$user || ($user['role'] !== 'gestor' && $user['role'] !== 'admin')) {
            $response = new \Slim\Psr7\Response();
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Acceso denegado. Se requieren permisos de gestor o administrador'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(403);
        }

        return $handler->handle($request);
    }
}