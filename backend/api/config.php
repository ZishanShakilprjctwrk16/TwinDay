<?php

declare(strict_types=1);

const DB_HOST = '127.0.0.1';
const DB_NAME = 'twinday';
const DB_USER = 'root';
const DB_PASS = '';

function database(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    return $pdo;
}

function jsonResponse(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: http://127.0.0.1:5173');
    header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function issueToken(PDO $pdo, int $userId): string
{
    $token = bin2hex(random_bytes(32));
    $statement = $pdo->prepare(
        'INSERT INTO auth_tokens (user_id, token_hash, expires_at)
         VALUES (:user_id, :token_hash, DATE_ADD(NOW(), INTERVAL 7 DAY))'
    );
    $statement->execute([
        'user_id' => $userId,
        'token_hash' => hash('sha256', $token),
    ]);

    return $token;
}

function authenticatedUser(PDO $pdo): array
{
    $token = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? '';
    $authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if ($token === '' && preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches)) {
        $token = $matches[1];
    }

    if ($token === '') {
        jsonResponse(['error' => 'Authentication required.'], 401);
    }

    $statement = $pdo->prepare(
        'SELECT u.id, u.name, u.email, u.phone, u.status,
                GROUP_CONCAT(r.name) AS roles
         FROM auth_tokens t
         JOIN users u ON u.id = t.user_id
         LEFT JOIN user_roles ur ON ur.user_id = u.id
         LEFT JOIN roles r ON r.id = ur.role_id
         WHERE t.token_hash = :token_hash
           AND t.expires_at > NOW()
           AND u.status = \'active\'
         GROUP BY u.id'
    );
    $statement->execute(['token_hash' => hash('sha256', $token)]);
    $user = $statement->fetch();

    if (!$user) {
        jsonResponse(['error' => 'Invalid or expired authentication token.'], 401);
    }

    $user['roles'] = $user['roles'] ? explode(',', $user['roles']) : [];
    return $user;
}

function requireSuperAdmin(PDO $pdo): array
{
    $user = authenticatedUser($pdo);
    if (!in_array('super_admin', $user['roles'], true)) {
        jsonResponse(['error' => 'Super-admin access required.'], 403);
    }

    return $user;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
    jsonResponse(['ok' => true]);
}
