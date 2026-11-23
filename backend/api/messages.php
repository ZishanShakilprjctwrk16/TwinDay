<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

$pdo = database();
$user = authenticatedUser($pdo);
$userId = (int) $user['id'];
$isAdmin = in_array('super_admin', $user['roles'], true);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $statement = $pdo->prepare(
        'SELECT m.id, m.sender_id, m.recipient_id, m.subject, m.body, m.read_at, m.created_at,
                s.name AS sender_name, r.name AS recipient_name
         FROM messages m JOIN users s ON s.id = m.sender_id JOIN users r ON r.id = m.recipient_id
         WHERE m.sender_id = :sender_id OR m.recipient_id = :recipient_id
         ORDER BY m.created_at DESC'
    );
    $statement->execute(['sender_id' => $userId, 'recipient_id' => $userId]);
    $contactQuery = $isAdmin
        ? 'SELECT u.id, u.name, u.email FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE r.name=\'normal_user\' AND u.status=\'active\' ORDER BY u.name'
        : 'SELECT DISTINCT u.id, u.name, u.email FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE r.name=\'super_admin\' AND u.status=\'active\' ORDER BY u.name';
    $contacts = $pdo->query($contactQuery)->fetchAll();
    jsonResponse(['messages' => $statement->fetchAll(), 'contacts' => $contacts]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $recipientId = filter_var($input['recipient_id'] ?? null, FILTER_VALIDATE_INT);
    $subject = trim((string) ($input['subject'] ?? ''));
    $body = trim((string) ($input['body'] ?? ''));
    if (!$recipientId || $body === '') jsonResponse(['error' => 'Recipient and message body are required.'], 422);

    $recipientCheck = $pdo->prepare(
        'SELECT u.id, EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=u.id AND r.name=\'super_admin\') AS is_admin
         FROM users u WHERE u.id = :id AND u.status=\'active\''
    );
    $recipientCheck->execute(['id' => $recipientId]);
    $recipient = $recipientCheck->fetch();
    if (!$recipient || (!$isAdmin && !(bool) $recipient['is_admin'])) {
        jsonResponse(['error' => 'You may only message an active super admin.'], 403);
    }

    $statement = $pdo->prepare('INSERT INTO messages (sender_id, recipient_id, subject, body) VALUES (:sender_id, :recipient_id, :subject, :body)');
    $statement->execute(['sender_id' => $userId, 'recipient_id' => $recipientId, 'subject' => $subject ?: null, 'body' => $body]);
    jsonResponse(['id' => (int) $pdo->lastInsertId()], 201);
}

jsonResponse(['error' => 'Method not allowed'], 405);
