<?php
use indura\json\Response;

require ROOTPATH . '/app/database/database.php';
require ROOTPATH . '/app/helpers/encryptor.php';
require ROOTPATH . '/app/constants/auth.php';

$success = false;
$debugData = [];

function isHexId(mixed $value): bool {
    return is_string($value) && strlen($value) === 32 && ctype_xdigit($value);
}

$jsonData = json_decode(file_get_contents('php://input'), true);

$selectUsername = $cursor->prepare('SELECT * FROM accounts WHERE username = :username;');

$findCard = $cursor->prepare('SELECT id, account_id FROM cards WHERE id = :id;');

$selectUserById = $cursor->prepare(
    'SELECT BIN_TO_UUID(id) AS id, username, root FROM accounts WHERE id = :id LIMIT 1;'
);

$deleteCard = $cursor->prepare('DELETE FROM cards WHERE id = :id AND account_id = :account_id;');

$forceDeleteCard = $cursor->prepare('DELETE FROM cards WHERE id = :id;');

$updateCard = $cursor->prepare(
    'UPDATE cards SET title = :title, content = :content, x = :x, y = :y
     WHERE id = :id AND account_id = :account_id;'
);

$forceUpdateCard = $cursor->prepare(
    'UPDATE cards SET title = :title, content = :content, x = :x, y = :y
     WHERE id = :id;'
);

$insertCard = $cursor->prepare(
    'INSERT INTO cards (id, title, content, x, y, account_id, wall_id)
     VALUES (@new_card_id, :title, :content, :x, :y, :account_id, :wall_id);'
);

if ($jsonData) {
    $id = $jsonData['id'] ?? null;
    $title = trim((string)($jsonData['title'] ?? ''));
    $content = trim((string)($jsonData['body'] ?? $jsonData['content'] ?? ''));
    $wallName = $jsonData['wall_name'] ?? null;
    $x = $jsonData['x'] ?? null;
    $y = $jsonData['y'] ?? null;
    $accountId = $jsonData['account_id'] ?? null;
    $authKey = $jsonData['auth_key'] ?? null;
    $delete = !empty($jsonData['delete']);
} else {
    $id = $_POST['id'] ?? null;
    $title = trim((string)($_POST['title'] ?? ''));
    $content = trim((string)($_POST['body'] ?? $_POST['content'] ?? ''));
    $wallName = $_POST['wall_name'] ?? null;
    $x = $_POST['x'] ?? null;
    $y = $_POST['y'] ?? null;
    $accountId = $_POST['account_id'] ?? null;
    $authKey = $_POST['auth_key'] ?? null;
    $delete = !empty($_POST['delete']);
}

if (!isHexId($accountId)) {
    Response::error(message: 'You must log in to do this');
    exit;
}

if (!$authKey) {
    Response::error(message: 'You need to send your auth key');
    exit;
}

try {
    $rawAccountId = hex2bin($accountId);

    $existingCard = null;

    if (isHexId($id)) {
        $rawId = hex2bin($id);
        $findCard->execute(['id' => $rawId]);
        $existingCard = $findCard->fetch(\PDO::FETCH_ASSOC);
    }

    $debugData['idProvided'] = $id;
    $debugData['cardFound'] = $existingCard ? true : false;

    $userSuccess = $selectUserById->execute(['id' => $rawAccountId]);

    if (!$userSuccess) {
        Response::error(message: 'Error querying the database');
        exit;
    }

    $user = $selectUserById->fetch(\PDO::FETCH_ASSOC);

    if (!$user) {
        Response::error(message: 'The user does not exist');
        exit;
    }

    if (Encryptor::decrypt($authKey, $AUTHKEY) !== $accountId && !$user['root']) {
        Response::error(message: 'Invalid auth key');
        exit;
    }

    if ($existingCard && $existingCard['account_id'] !== $rawAccountId && !$user['root']) {
        Response::error(message: 'You do not have permission for this record');
        exit;
    }

    if ($delete) {
        if (!$existingCard) {
            Response::error(message: 'The record does not exist');
            exit;
        }

        if ($user['root']) {
            $success = $forceDeleteCard->execute([
                'id' => $existingCard['id']
            ]);
        } else {
            $success = $deleteCard->execute([
                'id' => $existingCard['id'],
                'account_id' => $rawAccountId
            ]);
        }

        $debugData['action'] = 'delete';
        $debugData['deleteSuccess'] = $success;

        if (!$success) {
            Response::error(message: 'The record could not be deleted', details: json_encode($debugData));
            exit;
        }

        Response::success(message: 'Record deleted', data: [
            'id' => bin2hex($existingCard['id'])
        ]);
        exit;
    }

    if (empty($title) || empty($content) || $x === null || $y === null) {
        Response::error(message: 'Invalid fields');
        exit;
    }

    if (strlen($title) > 20) {
        Response::error(message: 'The title cannot exceed 20 characters');
        exit;
    }

    $x = (int) round((float) $x);
    $y = (int) round((float) $y);

    if ($existingCard) {
        if ($user['root']) {
            $success = $forceUpdateCard->execute([
                'title' => $title,
                'content' => $content,
                'x' => $x,
                'y' => $y,
                'id' => $existingCard['id']
            ]);
        } else {
            $success = $updateCard->execute([
                'title' => $title,
                'content' => $content,
                'x' => $x,
                'y' => $y,
                'id' => $existingCard['id'],
                'account_id' => $rawAccountId
            ]);
        }
        $debugData['action'] = 'update';
        $debugData['updateSuccess'] = $success;

        $resultId = $existingCard['id'];
    } else {
        $cursor->exec('SET @new_card_id = UUID_TO_BIN(UUID());');

        $wallRecord = $selectUsername->execute(['username' => $wallName]);

        if (!$wallRecord) {
            Response::error(message: 'The wall does not exist');
            exit;
        }

        $wallAccount = $selectUsername->fetch(\PDO::FETCH_ASSOC);

        $success = $insertCard->execute([
            'title' => $title,
            'content' => $content,
            'x' => $x,
            'wall_id' => $wallAccount['id'],
            'y' => $y,
            'account_id' => $rawAccountId
        ]);

        $debugData['action'] = 'insert';
        $debugData['insertSuccess'] = $success;

        if ($success) {
            $fetchNewId = $cursor->query('SELECT @new_card_id AS id;');
            $newIdRow = $fetchNewId->fetch(\PDO::FETCH_ASSOC);
            $resultId = $newIdRow['id'] ?? null;
        } else {
            $resultId = null;
        }
    }
} catch (\Exception $e) {
    $debugData['error'] = $e->getMessage();
    Response::error(message: 'Error saving the record', details: json_encode($debugData));
    exit;
}

if (!$success || !$resultId) {
    Response::error(message: 'Something went wrong', details: json_encode($debugData));
} else {
    Response::success(message: 'Record saved', data: [
        'id' => bin2hex($resultId)
    ]);
}