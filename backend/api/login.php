<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
$email = strtolower(trim((string) ($input['email'] ?? '')));
$password = (string) ($input['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
    jsonResponse(['error' => 'Email and password are required.'], 422);
}

$pdo = database();
$statement = $pdo->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
$statement->execute(['email' => $email]);
$account = $statement->fetch();

if (!$account || $account['status'] !== 'active' || !password_verify($password, $account['password_hash'])) {
    jsonResponse(['error' => 'Invalid email or password.'], 401);
}

$roleStatement = $pdo->prepare(
    'SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = :user_id'
);
$roleStatement->execute(['user_id' => $account['id']]);
$roles = array_column($roleStatement->fetchAll(), 'name');

jsonResponse([
    'token' => issueToken($pdo, (int) $account['id']),
    'user' => [
        'id' => (int) $account['id'],
        'name' => $account['name'],
        'email' => $account['email'],
        'phone' => $account['phone'],
        'roles' => $roles,
    ],
]);
