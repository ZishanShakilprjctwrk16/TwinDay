<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
$name = trim((string) ($input['name'] ?? ''));
$email = strtolower(trim((string) ($input['email'] ?? '')));
$phone = trim((string) ($input['phone'] ?? ''));
$password = (string) ($input['password'] ?? '');

if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $phone === '' || strlen($password) < 8) {
    jsonResponse([
        'error' => 'Name, valid email, phone, and a password of at least 8 characters are required.',
    ], 422);
}

try {
    $pdo = database();
    $pdo->beginTransaction();

    $statement = $pdo->prepare(
        'INSERT INTO users (name, email, phone, password_hash) VALUES (:name, :email, :phone, :password_hash)'
    );
    $statement->execute([
        'name' => $name,
        'email' => $email,
        'phone' => $phone,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
    ]);

    $userId = (int) $pdo->lastInsertId();
    $roleStatement = $pdo->prepare(
        'INSERT INTO user_roles (user_id, role_id)
         SELECT :user_id, id FROM roles WHERE name = \'normal_user\''
    );
    $roleStatement->execute(['user_id' => $userId]);
    $token = issueToken($pdo, $userId);
    $pdo->commit();

    jsonResponse([
        'token' => $token,
        'user' => [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'roles' => ['normal_user'],
        ],
    ], 201);
} catch (PDOException $exception) {
    if ($exception->errorInfo[1] ?? null === 1062) {
        jsonResponse(['error' => 'An account with this email already exists.'], 409);
    }

    error_log($exception->getMessage());
    jsonResponse(['error' => 'Unable to create the account.'], 500);
}
