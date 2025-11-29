<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

$app = AppFactory::create();

require __DIR__ . '/../app/configuracion/database.php';

$app->addErrorMiddleware(true, true, true);

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

$routes = require __DIR__ . '/../app/rutas/api.php';
$routes($app);

$app->run();
