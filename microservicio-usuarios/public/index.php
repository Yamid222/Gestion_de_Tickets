<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Illuminate\Database\Capsule\Manager as Capsule;

require __DIR__ . '/../vendor/autoload.php';

$app = AppFactory::create();

/* ===================================
   CONFIGURACIÓN DE ELOQUENT
=================================== */
$capsule = new Capsule;

$capsule->addConnection([
    'driver'    => 'mysql',
    'host'      => '127.0.0.1',
    'database'  => 'mi_base',
    'username'  => 'root',
    'password'  => '',
    'charset'   => 'utf8',
    'collation' => 'utf8_unicode_ci',
    'prefix'    => '',
]);

$capsule->setAsGlobal();
$capsule->bootEloquent();

/* ===================================
   CORS
=================================== */
$app->options('/{routes:.+}', function ($request, $response) {
    return $response;
});

$app->add(function (Request $request, $handler) {
    $origin = $request->getHeaderLine('Origin') ?: '*';

    $response = $handler->handle($request);

    $response = $response
        ->withHeader('Access-Control-Allow-Origin', $origin)
        ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->withHeader('Access-Control-Allow-Credentials', 'true');

    if ($request->getMethod() === 'OPTIONS') {
        return $response->withStatus(200);
    }

    return $response;
});

/* ===================================
   MIDDLEWARE GLOBAL
=================================== */


/* ===================================
   RUTAS
=================================== */
$app->get('/', function (Request $request, Response $response) {
    $response->getBody()->write("MICROSERVICIO DE USUARIOS");
    return $response;
});

// Ruta con BD
$app->get('/users', function (Request $request, Response $response) {
    $users = Capsule::table('users')->get();
    $response->getBody()->write($users->toJson());
    return $response->withHeader('Content-Type', 'application/json');
});

// Ruta con middleware individual
$app->get('/admin', function ($req, $res) {
    $res->getBody()->write("Zona segura");
    return $res;
})->add(function ($req, $handler) {
    $token = $req->getHeaderLine('Authorization');

    if ($token !== 'Bearer 12345') {
        $res = new \Slim\Psr7\Response();
        $res->getBody()->write('No autorizado');
        return $res->withStatus(401);
    }

    return $handler->handle($req);
});

$app->run();
