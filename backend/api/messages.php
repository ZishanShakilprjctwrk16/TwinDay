<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

$pdo = database();
$user = authenticatedUser($pdo);
$userId = (int) $user['id'];
$isAdmin = in_array('super_admin', $user['roles'], true);
$publicUploadBase = 'http://127.0.0.1/twinday-api/';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $markRead = $pdo->prepare('UPDATE messages SET read_at = NOW() WHERE recipient_id = :recipient_id AND read_at IS NULL');
    $markRead->execute(['recipient_id' => $userId]);
    $statement = $pdo->prepare(
        'SELECT m.id, m.sender_id, m.recipient_id, m.subject, m.body, m.attachment_name, m.attachment_path,
                m.attachment_type, m.attachment_size, m.read_at, m.created_at,
                s.name AS sender_name, r.name AS recipient_name
         FROM messages m JOIN users s ON s.id = m.sender_id JOIN users r ON r.id = m.recipient_id
         WHERE m.sender_id = :sender_id OR m.recipient_id = :recipient_id
         ORDER BY m.created_at DESC'
    );
    $statement->execute(['sender_id' => $userId, 'recipient_id' => $userId]);
    $messages = $statement->fetchAll();
    foreach ($messages as &$message) {
        $message['attachment_url'] = $message['attachment_path'] ? $publicUploadBase . $message['attachment_path'] : null;
    }
    unset($message);
    $contactQuery = $isAdmin
        ? 'SELECT u.id, u.name, u.email FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE r.name=\'normal_user\' AND u.status=\'active\' ORDER BY u.name'
        : 'SELECT DISTINCT u.id, u.name, u.email FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE r.name=\'super_admin\' AND u.status=\'active\' ORDER BY u.name';
    $contacts = $pdo->query($contactQuery)->fetchAll();
    jsonResponse(['messages' => $messages, 'contacts' => $contacts]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $isMultipart = str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data');
    $input = $isMultipart ? $_POST : (json_decode(file_get_contents('php://input'), true) ?: []);
    $recipientId = filter_var($input['recipient_id'] ?? null, FILTER_VALIDATE_INT);
    $subject = trim((string) ($input['subject'] ?? ''));
    $body = trim((string) ($input['body'] ?? ''));
    $file = $_FILES['attachment'] ?? null;
    if (!$recipientId || ($body === '' && !$file)) jsonResponse(['error' => 'Recipient and message text or attachment are required.'], 422);

    $recipientCheck = $pdo->prepare(
        'SELECT u.id, EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=u.id AND r.name=\'super_admin\') AS is_admin
         FROM users u WHERE u.id = :id AND u.status=\'active\''
    );
    $recipientCheck->execute(['id' => $recipientId]);
    $recipient = $recipientCheck->fetch();
    if (!$recipient || (!$isAdmin && !(bool) $recipient['is_admin'])) jsonResponse(['error' => 'You may only message an active super admin.'], 403);

    $attachment = ['name' => null, 'path' => null, 'type' => null, 'size' => null];
    if ($file) {
        if ($file['error'] !== UPLOAD_ERR_OK) jsonResponse(['error' => 'The attachment could not be uploaded.'], 422);
        if ((int) $file['size'] > 10 * 1024 * 1024) jsonResponse(['error' => 'Attachments must be 10 MB or smaller.'], 422);
        $allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/zip', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        if (!in_array($mime, $allowedTypes, true)) jsonResponse(['error' => 'This file type is not supported.'], 422);
        $uploadDir = __DIR__ . '/../uploads';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0775, true);
        $safeName = preg_replace('/[^A-Za-z0-9._-]/', '_', basename((string) $file['name'])) ?: 'attachment';
        $storedName = bin2hex(random_bytes(12)) . '_' . $safeName;
        if (!move_uploaded_file($file['tmp_name'], $uploadDir . DIRECTORY_SEPARATOR . $storedName)) jsonResponse(['error' => 'Unable to store the attachment.'], 500);
        $attachment = ['name' => $safeName, 'path' => 'uploads/' . $storedName, 'type' => $mime, 'size' => (int) $file['size']];
    }

    $statement = $pdo->prepare('INSERT INTO messages (sender_id, recipient_id, subject, body, attachment_name, attachment_path, attachment_type, attachment_size) VALUES (:sender_id, :recipient_id, :subject, :body, :attachment_name, :attachment_path, :attachment_type, :attachment_size)');
    $statement->execute(['sender_id' => $userId, 'recipient_id' => $recipientId, 'subject' => $subject ?: null, 'body' => $body, 'attachment_name' => $attachment['name'], 'attachment_path' => $attachment['path'], 'attachment_type' => $attachment['type'], 'attachment_size' => $attachment['size']]);
    jsonResponse(['id' => (int) $pdo->lastInsertId()], 201);
}

jsonResponse(['error' => 'Method not allowed'], 405);
