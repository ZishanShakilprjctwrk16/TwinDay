<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
$name = trim((string) ($input['name'] ?? ''));
$email = strtolower(trim((string) ($input['email'] ?? '')));
$password = (string) ($input['password'] ?? '');

if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
    jsonResponse([
        'error' => 'Name, valid email, and a password of at least 8 characters are required.',
    ], 422);
}

try {
    $statement = database()->prepare(
        'INSERT INTO users (name, email, password_hash) VALUES (:name, :email, :password_hash)'
    );
    $statement->execute([
        'name' => $name,
        'email' => $email,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
    ]);

    jsonResponse([
        'user' => [
            'id' => (int) database()->lastInsertId(),
            'name' => $name,
            'email' => $email,
        ],
    ], 201);
} catch (PDOException $exception) {
    if ($exception->errorInfo[1] ?? null === 1062) {
        jsonResponse(['error' => 'An account with this email already exists.'], 409);
    }

    error_log($exception->getMessage());
    jsonResponse(['error' => 'Unable to create the account.'], 500);
}
