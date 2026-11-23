<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

$pdo = database();
$user = authenticatedUser($pdo);
$userId = (int) $user['id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $statement = $pdo->prepare(
        'SELECT id, routine_task_id, text, remind_at, status, created_at
         FROM reminders WHERE user_id = :user_id ORDER BY remind_at ASC'
    );
    $statement->execute(['user_id' => $userId]);
    jsonResponse(['reminders' => $statement->fetchAll()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $text = trim((string) ($input['text'] ?? ''));
    $remindAt = trim((string) ($input['remind_at'] ?? ''));
    $taskId = filter_var($input['routine_task_id'] ?? null, FILTER_VALIDATE_INT) ?: null;

    if ($text === '' || $remindAt === '') {
        jsonResponse(['error' => 'Reminder text and time are required.'], 422);
    }

    if ($taskId) {
        $taskCheck = $pdo->prepare(
            'SELECT rt.id FROM routine_tasks rt JOIN routines r ON r.id = rt.routine_id
             WHERE rt.id = :task_id AND r.user_id = :user_id'
        );
        $taskCheck->execute(['task_id' => $taskId, 'user_id' => $userId]);
        if (!$taskCheck->fetch()) jsonResponse(['error' => 'Routine task not found.'], 404);
    }

    $statement = $pdo->prepare(
        'INSERT INTO reminders (user_id, routine_task_id, text, remind_at) VALUES (:user_id, :task_id, :text, :remind_at)'
    );
    $statement->execute(['user_id' => $userId, 'task_id' => $taskId, 'text' => $text, 'remind_at' => $remindAt]);
    jsonResponse(['id' => (int) $pdo->lastInsertId()], 201);
}

if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $input = json_decode(file_get_contents('php://input'), true);
    $reminderId = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT);
    $status = (string) ($input['status'] ?? 'dismissed');
    if (!$reminderId || !in_array($status, ['pending', 'sent', 'dismissed'], true)) {
        jsonResponse(['error' => 'Valid reminder id and status are required.'], 422);
    }
    $statement = $pdo->prepare('UPDATE reminders SET status = :status WHERE id = :id AND user_id = :user_id');
    $statement->execute(['status' => $status, 'id' => $reminderId, 'user_id' => $userId]);
    jsonResponse(['ok' => true]);
}

jsonResponse(['error' => 'Method not allowed'], 405);
