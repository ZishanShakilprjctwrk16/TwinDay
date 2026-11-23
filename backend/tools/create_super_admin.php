<?php

declare(strict_types=1);

require_once __DIR__ . '/../api/config.php';

if (PHP_SAPI !== 'cli') {
    exit("This tool must be run from the command line.\n");
}

$name = trim((string) readline('Admin name: '));
$email = strtolower(trim((string) readline('Admin email: ')));
$phone = trim((string) readline('Admin phone: '));
$password = (string) readline('Admin password (8+ characters): ');

if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $phone === '' || strlen($password) < 8) {
    exit("Name, valid email, phone, and an 8+ character password are required.\n");
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

    $roleStatement = $pdo->prepare(
        'INSERT INTO user_roles (user_id, role_id)
         SELECT :user_id, id FROM roles WHERE name = \'super_admin\''
    );
    $roleStatement->execute(['user_id' => (int) $pdo->lastInsertId()]);
    $pdo->commit();

    echo "Super admin created successfully.\n";
} catch (PDOException $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    if ($exception->errorInfo[1] ?? null === 1062) {
        exit("An account with this email already exists.\n");
    }

    exit("Unable to create the super admin.\n");
}
