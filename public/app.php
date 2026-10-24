<?php
use indura\router\Views;

$router = new Views(
    viewsPath: ROOTPATH . '/app/views/', 
    layoutsPath: ROOTPATH . '/app/layouts/'
);

$router->post(
    path: '/controllers/auth', 
    view: 'auth', 
    data: [
        'username' => Views::param('username'),
        'password'=> Views::param('password'),
        'login'=> Views::param('login')
    ],
    layout: 'controller'
);

$router->get(
    path: '/controllers/cards', 
    view: 'cards', 
    layout: 'controller'
);

$router->post(
    path: '/controllers/card', 
    view: 'card', 
    data: [
        'id' => Views::param('id'),
        'title' => Views::param('title'),
        'content' => Views::param('body') ?? Views::param('content'),
        'wallname' => Views::param('wall_name'),
        'x' => Views::param('x'),
        'y' => Views::param('y'),
        'accountId' => Views::param('account_id'),
        'delete' => Views::param('delete') 
    ],
    layout: 'controller'
);

$router->get(
    path: '/controllers/account', 
    view: 'account', 
    data: [
        'id' => Views::param('id')
    ],
    layout: 'controller'
);

$router->get(
    path: '/{username}', 
    view: 'wall', 
    data: [
        'title' => 'My wall - Wall'
    ],
    layout: 'wall'
);

$router->get(
    path: '/', 
    view: 'home', 
    data: [
        'title' => 'My wall - Auth'
    ],
    layout: 'home'
);

$router->run();