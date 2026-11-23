<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$pdo = database();
requireSuperAdmin($pdo);

$statement = $pdo->query(
    'SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at,
            COALESCE(GROUP_CONCAT(r.name ORDER BY r.name SEPARATOR \', \'), \'\') AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     GROUP BY u.id
     ORDER BY u.created_at DESC'
);

$users = $statement->fetchAll();
foreach ($users as &$user) {
    $user['roles'] = $user['roles'] === '' ? [] : explode(', ', $user['roles']);
}

jsonResponse(['users' => $users]);
