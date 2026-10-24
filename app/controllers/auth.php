<?php
use indura\json\Response;

require ROOTPATH . '/app/database/database.php';
require ROOTPATH . '/app/helpers/encryptor.php';
require ROOTPATH . '/app/constants/auth.php';

$success = false;
$debugData = [];

$jsonData = json_decode(file_get_contents('php://input'), true);

if ($jsonData) {
    $username = $jsonData['username'] ?? null;
    $password = $jsonData['password'] ?? null;
    $login = $jsonData['login'] ?? null;
} else {
    $username = $_POST['username'] ?? null;
    $password = $_POST['password'] ?? null;
    $login = $_POST['login'] ?? null;
}

$newAccount = !$login;

if (!$username || !$password) {
    Response::error(message: 'Invalid fields');
    exit;
}

$selectAccount = $cursor->prepare(
    'SELECT * FROM accounts WHERE username = :username AND password = :password;'
);

$createAccount = $cursor->prepare(
    'INSERT INTO accounts (username, password) VALUES (:username, :password);'
);

$findNewId = $cursor->prepare('SELECT * FROM accounts WHERE username = :username LIMIT 1;');

$rawId = null;
$rawRoot = null;
$rawUsername = null;

try {
    $queryExecuted = $selectAccount->execute([
        'username' => $username,
        'password' => $password
    ]);

    $fetchedAccount = $selectAccount->fetch(\PDO::FETCH_ASSOC);

    $debugData['queryExecuted'] = $queryExecuted;
    $debugData['accountFound'] = $fetchedAccount ? true : false;
    $debugData['isNewAccount'] = $newAccount;

    if ($newAccount && !$fetchedAccount) {
        $success = $createAccount->execute([
            'username' => $username,
            'password' => $password
        ]);
        $debugData['action'] = 'insert-attempt';
        $debugData['insertSuccess'] = $success;

        if ($success) {
            $findNewId->execute(['username' => $username]);
            $newAccountRow = $findNewId->fetch(\PDO::FETCH_ASSOC);
            $rawId = $newAccountRow['id'] ?? null;
            $rawRoot = $newAccountRow['root'] ?? null;
            $rawUsername = $newAccountRow['username'] ?? null;
        }
    } else if (!$newAccount && $fetchedAccount) {
        $success = true;
        $debugData['action'] = 'login-success';
        $rawId = $fetchedAccount['id'] ?? null;
        $rawRoot = $fetchedAccount['root'] ?? null;
        $rawUsername = $fetchedAccount['username'] ?? null;
    } else {
        $success = false;
        $debugData['action'] = 'auth-failed-logic-mismatch';
    }
} catch (\Exception $e) {
    $debugData['error'] = $e->getMessage();
    Response::error(message: 'Error querying the database', details: json_encode($debugData));
    exit;
}

$idString = $rawId ? (string) bin2hex($rawId) : 'unknown';
$debugData['accountId'] = $idString;

$debugString = json_encode($debugData);

if (!$success) {
    Response::error(message: 'Something went wrong', details: $debugString);
} else {
    Response::success(message: 'Successful request', data: [
        'user' => [
            'id' => $idString,
            'root' => $rawRoot,
            'username' => $rawUsername,
            'auth_key' => Encryptor::encrypt($idString, $AUTHKEY)
        ]
    ]);
}