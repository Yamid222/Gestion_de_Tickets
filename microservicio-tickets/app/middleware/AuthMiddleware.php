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
        // URL del microservicio de usuarios - ajustar según tu configuración
        $this->userServiceUrl = 'http://localhost:8000/api'; // Puerto del microservicio de usuarios
    }

    /**
     * Middleware para verificar autenticación mediante llamada HTTP
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

        $token = $authHeader[0];
        
        // Remover el prefijo "Bearer " si existe
        $token = str_replace('Bearer ', '', $token);

        if (empty($token)) {
            $response = new \Slim\Psr7\Response();
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Token de autorización inválido'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }

        // Validar el token mediante llamada HTTP al microservicio de usuarios
        $userInfo = $this->validateTokenWithUserService($token);

        if (!$userInfo) {
            $response = new \Slim\Psr7\Response();
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Token de autorización inválido o expirado'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }

        // Agregar información del usuario al request
        $request = $request->withAttribute('user', $userInfo);

        return $handler->handle($request);
    }

    /**
     * Validar token con el microservicio de usuarios
     */
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

            // Log para depuración (puedes remover esto después)
            if ($curlError) {
                error_log("Error CURL al validar token: " . $curlError);
            }

            // Verificar si la respuesta es HTML (error del servidor)
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

            // Log para depuración
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
    /**
     * Middleware para verificar que el usuario sea administrador
     */
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
    /**
     * Middleware para verificar que el usuario sea gestor o administrador
     */
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