<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

$pdo = database();
$admin = requireSuperAdmin($pdo);

if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT);
    $name = trim((string) ($input['name'] ?? ''));
    $email = strtolower(trim((string) ($input['email'] ?? '')));
    $phone = trim((string) ($input['phone'] ?? ''));
    $status = (string) ($input['status'] ?? 'active');
    $roles = is_array($input['roles'] ?? null) ? array_values(array_unique($input['roles'])) : null;

    if (!$userId || $name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $phone === '' || !in_array($status, ['active', 'suspended'], true) || ($roles !== null && array_diff($roles, ['normal_user', 'super_admin']))) {
        jsonResponse(['error' => 'Valid id, name, email, phone, and status are required.'], 422);
    }
    if ((int) $admin['id'] === $userId && $roles !== null && !in_array('super_admin', $roles, true)) {
        jsonResponse(['error' => 'You cannot remove your own super-admin role.'], 422);
    }

    try {
        $pdo->beginTransaction();
        $statement = $pdo->prepare(
            'UPDATE users SET name = :name, email = :email, phone = :phone, status = :status WHERE id = :id'
        );
        $statement->execute([
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'status' => $status,
        ]);
        if ($roles !== null) {
            $pdo->prepare('DELETE FROM user_roles WHERE user_id = :user_id')->execute(['user_id' => $userId]);
            $roleStatement = $pdo->prepare('INSERT INTO user_roles (user_id, role_id) SELECT :user_id, id FROM roles WHERE name = :role');
            foreach ($roles as $role) $roleStatement->execute(['user_id' => $userId, 'role' => $role]);
        }
        $pdo->commit();
        jsonResponse(['ok' => true]);
    } catch (PDOException $exception) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        if (($exception->errorInfo[1] ?? null) === 1062) {
            jsonResponse(['error' => 'Another account already uses this email.'], 409);
        }
        jsonResponse(['error' => 'Unable to update the user.'], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT);

    if (!$userId) {
        jsonResponse(['error' => 'A valid user id is required.'], 422);
    }
    if ((int) $admin['id'] === $userId) {
        jsonResponse(['error' => 'You cannot delete the currently logged-in admin.'], 422);
    }

    $statement = $pdo->prepare('DELETE FROM users WHERE id = :id');
    $statement->execute(['id' => $userId]);
    jsonResponse(['ok' => true]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

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
