<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';
$pdo = database();
$user = authenticatedUser($pdo);
$userId = (int) $user['id'];

function findRelationship(PDO $pdo, int $userId, int $otherId): ?array {
    $statement = $pdo->prepare('SELECT id, owner_id, caregiver_id, permission, status FROM caregiver_relationships WHERE (owner_id = :user_owner AND caregiver_id = :other_caregiver) OR (owner_id = :other_owner AND caregiver_id = :user_caregiver)');
    $statement->execute(['user_owner' => $userId, 'other_caregiver' => $otherId, 'other_owner' => $otherId, 'user_caregiver' => $userId]);
    return $statement->fetch() ?: null;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $statement = $pdo->prepare('SELECT cr.id, cr.owner_id, cr.caregiver_id, cr.permission, cr.status, owner.name AS owner_name, owner.email AS owner_email, caregiver.name AS caregiver_name, caregiver.email AS caregiver_email FROM caregiver_relationships cr JOIN users owner ON owner.id = cr.owner_id JOIN users caregiver ON caregiver.id = cr.caregiver_id WHERE cr.owner_id = :owner_user_id OR cr.caregiver_id = :caregiver_user_id ORDER BY cr.updated_at DESC');
    $statement->execute(['owner_user_id' => $userId, 'caregiver_user_id' => $userId]);
    $dependentId = filter_var($_GET['dependent_id'] ?? null, FILTER_VALIDATE_INT);
    $dashboard = null;
    if ($dependentId && $dependentId !== $userId) {
        $link = findRelationship($pdo, $userId, $dependentId);
        if (!$link || $link['status'] !== 'active') jsonResponse(['error' => 'You are not connected to this user.'], 403);
        $ownerId = (int) $link['owner_id'];
        $routineStatement = $pdo->prepare('SELECT r.id, r.name, r.content, rt.id AS task_id, rt.title AS task_title, rt.due_time, rt.recurrence_rule, rt.completed_at FROM routines r LEFT JOIN routine_tasks rt ON rt.routine_id = r.id WHERE r.user_id = :user_id ORDER BY r.created_at DESC, rt.due_time');
        $routineStatement->execute(['user_id' => $ownerId]);
        $routines = [];
        foreach ($routineStatement->fetchAll() as $row) {
            $routineId = (int) $row['id'];
            if (!isset($routines[$routineId])) $routines[$routineId] = ['id' => $routineId, 'name' => $row['name'], 'content' => $row['content'], 'tasks' => []];
            if ($row['task_id'] !== null) $routines[$routineId]['tasks'][] = ['id' => (int) $row['task_id'], 'title' => $row['task_title'], 'due_time' => $row['due_time'], 'recurrence_rule' => $row['recurrence_rule'], 'completed_at' => $row['completed_at']];
        }
        $reminderStatement = $pdo->prepare('SELECT id, text, remind_at, status FROM reminders WHERE user_id = :user_id ORDER BY remind_at ASC');
        $reminderStatement->execute(['user_id' => $ownerId]);
        $dashboard = ['dependent_id' => $ownerId, 'routines' => array_values($routines), 'reminders' => $reminderStatement->fetchAll()];
    }
    jsonResponse(['relationships' => $statement->fetchAll(), 'dashboard' => $dashboard]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $action = (string) ($input['action'] ?? 'invite');
    if ($action === 'accept') {
        $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT);
        $statement = $pdo->prepare("UPDATE caregiver_relationships SET status = 'active' WHERE id = :id AND caregiver_id = :user_id AND status = 'pending'");
        $statement->execute(['id' => $id, 'user_id' => $userId]);
        jsonResponse(['ok' => $statement->rowCount() > 0]);
    }
    if ($action === 'revoke') {
        $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT);
        $statement = $pdo->prepare("UPDATE caregiver_relationships SET status = 'revoked' WHERE id = :id AND (owner_id = :user_id OR caregiver_id = :user_id)");
        $statement->execute(['id' => $id, 'user_id' => $userId]);
        jsonResponse(['ok' => true]);
    }
    $email = strtolower(trim((string) ($input['email'] ?? '')));
    $permission = (string) ($input['permission'] ?? 'viewer');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !in_array($permission, ['viewer', 'caregiver'], true)) jsonResponse(['error' => 'A valid email and permission are required.'], 422);
    $target = $pdo->prepare("SELECT id FROM users WHERE email = :email AND status = 'active'");
    $target->execute(['email' => $email]);
    $targetId = (int) ($target->fetchColumn() ?: 0);
    if (!$targetId || $targetId === $userId) jsonResponse(['error' => 'That active user could not be found.'], 404);
    $statement = $pdo->prepare("INSERT INTO caregiver_relationships (owner_id, caregiver_id, permission, status) VALUES (:owner_id, :caregiver_id, :permission, 'pending') ON DUPLICATE KEY UPDATE permission = VALUES(permission), status = 'pending'");
    $statement->execute(['owner_id' => $userId, 'caregiver_id' => $targetId, 'permission' => $permission]);
    jsonResponse(['ok' => true], 201);
}
jsonResponse(['error' => 'Method not allowed'], 405);
