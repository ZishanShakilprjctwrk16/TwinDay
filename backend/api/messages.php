<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

$pdo = database();
$user = authenticatedUser($pdo);
$userId = (int) $user['id'];
$publicUploadBase = 'http://127.0.0.1/twinday-api/';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $markRead = filter_var($_GET['mark_read'] ?? false, FILTER_VALIDATE_BOOLEAN);
    $unreadStatement = $pdo->prepare('SELECT COUNT(*) FROM messages WHERE recipient_id = :recipient_id AND read_at IS NULL');
    $unreadStatement->execute(['recipient_id' => $userId]);
    $unreadCount = (int) $unreadStatement->fetchColumn();
    if ($markRead) {
        $markReadStatement = $pdo->prepare('UPDATE messages SET read_at = NOW() WHERE recipient_id = :recipient_id AND read_at IS NULL');
        $markReadStatement->execute(['recipient_id' => $userId]);
    }
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
    $contactStatement = $pdo->prepare(
        'SELECT u.id, u.name, u.email FROM users u
         WHERE u.status = \'active\' AND u.id <> :user_id
           AND EXISTS (SELECT 1 FROM messages m WHERE (m.sender_id = :sender_id AND m.recipient_id = u.id) OR (m.recipient_id = :recipient_id AND m.sender_id = u.id))
         ORDER BY u.name'
    );
    $contactStatement->execute(['user_id' => $userId, 'sender_id' => $userId, 'recipient_id' => $userId]);
    $contacts = $contactStatement->fetchAll();
    $search = trim((string) ($_GET['search'] ?? ''));
    $searchResults = [];
    if (strlen($search) >= 2) {
        $searchStatement = $pdo->prepare('SELECT id, name, email FROM users WHERE status = \'active\' AND id <> :user_id AND (name LIKE :name_search OR email LIKE :email_search) ORDER BY name LIMIT 20');
        $searchPattern = '%' . $search . '%';
        $searchStatement->execute(['user_id' => $userId, 'name_search' => $searchPattern, 'email_search' => $searchPattern]);
        $searchResults = $searchStatement->fetchAll();
    }
    jsonResponse(['messages' => $messages, 'contacts' => $contacts, 'search_results' => $searchResults, 'unread_count' => $unreadCount]);
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
        'SELECT id FROM users WHERE id = :id AND status = \'active\''
    );
    $recipientCheck->execute(['id' => $recipientId]);
    $recipient = $recipientCheck->fetch();
    if (!$recipient || (int) $recipient['id'] === $userId) jsonResponse(['error' => 'You may only message another active user.'], 403);

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
