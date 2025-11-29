<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\User;
use App\Models\AuthToken;

class AuthController
{
    public function registro(Request $request, Response $response)
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);

            if (empty($data['name']) || empty($data['email']) || empty($data['password']) || empty($data['role'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Todos los campos son obligatorios'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            if (!in_array($data['role'], ['gestor', 'admin'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Rol no válido'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            if (User::where('email', $data['email'])->exists()) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'El email ya está registrado'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(409);
            }

            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => $data['role']
            ]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Usuario registrado exitosamente',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role
                ]
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Error interno del servidor: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function login(Request $request, Response $response)
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);

            if (empty($data['email']) || empty($data['password'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Email y contraseña son obligatorios'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            $user = User::where('email', $data['email'])->first();

            if (!$user || !$user->verifyPassword($data['password'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Credenciales inválidas'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
            }

            $authToken = AuthToken::createTokenForUser($user->id);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Inicio de sesión exitoso',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role
                    ],
                    'token' => $authToken->token
                ]
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

    public function logout(Request $request, Response $response)
    {
        try {
            $token = $request->getHeader('Authorization')[0] ?? '';
            $token = str_replace('Bearer ', '', $token);

            if (empty($token)) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Token no proporcionado'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            $deleted = AuthToken::where('token', $token)->delete();

            if (!$deleted) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Token no válido'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Sesión cerrada exitosamente'
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

    public function validateToken(Request $request, Response $response)
    {
        try {
            $token = $request->getHeader('Authorization')[0] ?? '';
            $token = str_replace('Bearer ', '', $token);

            if (empty($token)) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Token no proporcionado'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            $user = AuthToken::getUserByToken($token);

            if (!$user) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Token no válido'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Token válido',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role
                    ]
                ]
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