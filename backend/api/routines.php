<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

$pdo = database();
$user = authenticatedUser($pdo);
$userId = (int) $user['id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $statement = $pdo->prepare(
        'SELECT r.id, r.name, r.content, r.timezone, r.active, r.created_at,
                rt.id AS task_id, rt.title AS task_title, rt.notes AS task_notes,
                rt.due_time, rt.recurrence_rule, rt.active AS task_active
         FROM routines r LEFT JOIN routine_tasks rt ON rt.routine_id = r.id
         WHERE r.user_id = :user_id ORDER BY r.created_at DESC, rt.due_time'
    );
    $statement->execute(['user_id' => $userId]);
    $routines = [];
    foreach ($statement->fetchAll() as $row) {
        $id = (int) $row['id'];
        if (!isset($routines[$id])) {
            $routines[$id] = [
                'id' => $id,
                'name' => $row['name'],
                'content' => $row['content'],
                'timezone' => $row['timezone'],
                'active' => (bool) $row['active'],
                'tasks' => [],
            ];
        }
        if ($row['task_id'] !== null) {
            $routines[$id]['tasks'][] = [
                'id' => (int) $row['task_id'],
                'title' => $row['task_title'],
                'notes' => $row['task_notes'],
                'due_time' => $row['due_time'],
                'recurrence_rule' => $row['recurrence_rule'],
                'active' => (bool) $row['task_active'],
            ];
        }
    }
    jsonResponse(['routines' => array_values($routines)]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $name = trim((string) ($input['name'] ?? 'Daily routine'));
    $content = trim((string) ($input['content'] ?? ''));
    $timezone = trim((string) ($input['timezone'] ?? 'Asia/Dhaka'));
    $tasks = is_array($input['tasks'] ?? null) ? $input['tasks'] : [];

    if ($name === '' || $content === '') {
        jsonResponse(['error' => 'Routine name and content are required.'], 422);
    }

    try {
        $pdo->beginTransaction();
        $statement = $pdo->prepare('INSERT INTO routines (user_id, name, content, timezone) VALUES (:user_id, :name, :content, :timezone)');
        $statement->execute(['user_id' => $userId, 'name' => $name, 'content' => $content, 'timezone' => $timezone]);
        $routineId = (int) $pdo->lastInsertId();
        $taskStatement = $pdo->prepare(
            'INSERT INTO routine_tasks (routine_id, title, notes, due_time, recurrence_rule)
             VALUES (:routine_id, :title, :notes, :due_time, :recurrence_rule)'
        );
        $taskIds = [];
        foreach ($tasks as $task) {
            $title = trim((string) ($task['title'] ?? ''));
            if ($title === '') continue;
            $taskStatement->execute([
                'routine_id' => $routineId,
                'title' => $title,
                'notes' => trim((string) ($task['notes'] ?? '')) ?: null,
                'due_time' => ($task['due_time'] ?? '') ?: null,
                'recurrence_rule' => trim((string) ($task['recurrence_rule'] ?? '')) ?: null,
            ]);
            $taskIds[] = (int) $pdo->lastInsertId();
        }
        $pdo->commit();
        jsonResponse(['id' => $routineId, 'task_ids' => $taskIds], 201);
    } catch (Throwable $exception) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log($exception->getMessage());
        jsonResponse(['error' => 'Unable to save the routine.'], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    $routineId = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT);
    if (!$routineId) jsonResponse(['error' => 'A valid routine id is required.'], 422);
    $statement = $pdo->prepare('DELETE FROM routines WHERE id = :id AND user_id = :user_id');
    $statement->execute(['id' => $routineId, 'user_id' => $userId]);
    jsonResponse(['ok' => true]);
}

jsonResponse(['error' => 'Method not allowed'], 405);
