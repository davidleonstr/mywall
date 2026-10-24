<?php
use indura\json\Response;

require ROOTPATH . '/app/database/database.php';

$success = false;
$debugData = [];

$jsonData = json_decode(file_get_contents('php://input'), true);

if ($jsonData) {
    $userIdHex = $jsonData['id'] ?? null;
} else {
    $userIdHex = $_GET['id'] ?? null;
}

if (!$userIdHex) {
    Response::error(message: 'The user ID is required');
    exit;
}

$selectUser = $cursor->prepare(
    'SELECT BIN_TO_UUID(id) AS id, username, root FROM accounts WHERE id = :id LIMIT 1;'
);

try {
    $cleanHex = str_replace('-', '', $userIdHex);
    $binaryId = hex2bin($cleanHex);

    $queryExecuted = $selectUser->execute([
        'id' => $binaryId
    ]);

    $userData = $selectUser->fetch(\PDO::FETCH_ASSOC);

    $debugData['queryExecuted'] = $queryExecuted;
    $debugData['userFound'] = $userData ? true : false;

    if ($userData) {
        $success = true;
        Response::success(message: 'User successfully found', data: [
            'user' => $userData
        ]);
    } else {
        $success = false;
        Response::error(message: 'User not found', details: json_encode($debugData));
    }

} catch (\Exception $e) {
    $debugData['error'] = $e->getMessage();
    Response::error(message: 'The ID format is invalid', details: json_encode($debugData));
}