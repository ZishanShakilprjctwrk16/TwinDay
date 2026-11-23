<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

$pdo = database();
$user = authenticatedUser($pdo);
$userId = (int) $user['id'];

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
    jsonResponse(['user' => $user]);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'PATCH') {
    $input = json_decode(file_get_contents('php://input'), true);
    $name = trim((string) ($input['name'] ?? $user['name']));
    $email = strtolower(trim((string) ($input['email'] ?? $user['email'])));
    $phone = trim((string) ($input['phone'] ?? ($user['phone'] ?? '')));
    $password = (string) ($input['password'] ?? '');
    if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['error' => 'A name and valid email are required.'], 422);
    }
    if ($password !== '' && strlen($password) < 8) {
        jsonResponse(['error' => 'New password must be at least 8 characters.'], 422);
    }
    try {
        if ($password !== '') {
            $statement = $pdo->prepare('UPDATE users SET name=:name, email=:email, phone=:phone, password_hash=:password_hash WHERE id=:id');
            $statement->execute(['name' => $name, 'email' => $email, 'phone' => $phone ?: null, 'password_hash' => password_hash($password, PASSWORD_DEFAULT), 'id' => $userId]);
        } else {
            $statement = $pdo->prepare('UPDATE users SET name=:name, email=:email, phone=:phone WHERE id=:id');
            $statement->execute(['name' => $name, 'email' => $email, 'phone' => $phone ?: null, 'id' => $userId]);
        }
        $fresh = $pdo->prepare('SELECT id, name, email, phone, status FROM users WHERE id=:id');
        $fresh->execute(['id' => $userId]);
        $updated = $fresh->fetch();
        $updated['roles'] = $user['roles'];
        jsonResponse(['user' => $updated]);
    } catch (PDOException $exception) {
        if ((int) $exception->errorInfo[1] === 1062) jsonResponse(['error' => 'That email is already in use.'], 409);
        jsonResponse(['error' => 'Unable to update account.'], 500);
    }
}

jsonResponse(['error' => 'Method not allowed'], 405);
