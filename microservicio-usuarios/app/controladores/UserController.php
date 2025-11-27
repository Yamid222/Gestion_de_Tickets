<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\User;

class UserController
{
    /**
     * Listar todos los usuarios (solo administradores)
     */
    public function listar(Request $request, Response $response)
    {
        try {
            $users = User::select(['id', 'name', 'email', 'role', 'created_at', 'updated_at'])
                        ->orderBy('created_at', 'desc')
                        ->get();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $users
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
     * Obtener usuario por ID
     */
    public function obtener(Request $request, Response $response, array $args)
    {
        try {
            $userId = $args['id'];
            $user = User::select(['id', 'name', 'email', 'role', 'created_at', 'updated_at'])
                       ->find($userId);

            if (!$user) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $user
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
     * Actualizar usuario
     */
    public function actualizar(Request $request, Response $response, array $args)
    {
        try {
            $userId = $args['id'];
            $data = json_decode($request->getBody()->getContents(), true);

            $user = User::find($userId);

            if (!$user) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            // Campos actualizables
            $camposPermitidos = ['name', 'email', 'role'];
            $datosActualizacion = [];

            foreach ($camposPermitidos as $campo) {
                if (isset($data[$campo]) && !empty($data[$campo])) {
                    $datosActualizacion[$campo] = $data[$campo];
                }
            }

            // Validar rol si se está actualizando
            if (isset($datosActualizacion['role']) && !in_array($datosActualizacion['role'], ['gestor', 'admin'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Rol no válido'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            // Verificar email único si se está actualizando
            if (isset($datosActualizacion['email']) && 
                User::where('email', $datosActualizacion['email'])->where('id', '!=', $userId)->exists()) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'El email ya está en uso por otro usuario'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(409);
            }

            if (empty($datosActualizacion)) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'No se proporcionaron datos para actualizar'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            $user->update($datosActualizacion);
            $user->refresh();

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Usuario actualizado exitosamente',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role
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

    /**
     * Eliminar usuario
     */
    public function eliminar(Request $request, Response $response, array $args)
    {
        try {
            $userId = $args['id'];
            $user = User::find($userId);

            if (!$user) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $user->delete();

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Usuario eliminado exitosamente'
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