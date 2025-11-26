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

    return $response
        ->withHeader('Access-Control-Allow-Origin', $origin)
        ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->withHeader('Access-Control-Allow-Credentials', 'true');
});

/* ===================================
   RUTAS
=================================== */

// Ruta básica
$app->get('/', function (Request $request, Response $response) {
    $response->getBody()->write("MICROSERVICIO DE TICKETS");
    return $response;
});

// Ejemplo con BD
$app->get('/tickets', function (Request $request, Response $response) {
    $tickets = Capsule::table('tickets')->get();
    $response->getBody()->write($tickets->toJson());
    return $response->withHeader('Content-Type', 'application/json');
});

// Zona segura solo si la necesitas
$app->get('/admin', function ($req, $res) {
    $res->getBody()->write("Zona segura tickets");
    return $res;
});

$app->run();
