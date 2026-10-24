<?php
use indura\json\Response;

require ROOTPATH . '/app/database/database.php';

$jsonData = json_decode(file_get_contents('php://input'), true);

if ($jsonData) {
    $wallName = $jsonData['wall_name'] ?? null;
} else {
    $wallName = $_GET['wall_name'] ?? null;
}

$success = false;
$debugData = [];

$selectUsername = $cursor->prepare('SELECT * FROM accounts WHERE username = :username;');

$selectAllCards = $cursor->prepare(
    'SELECT id, title, content, x, y, account_id, wall_id FROM cards;'
);

$selectAllCardsFromWallId = $cursor->prepare('SELECT * FROM cards WHERE wall_id = :wall_id');

try {
    if ($wallName) {
        $selectUsername->execute(['username' => $wallName]);

        $user = $selectUsername->fetch(\PDO::FETCH_ASSOC);

        if (!$user) {
            Response::error(message: 'This wall does not exist');
            exit;
        }

        $wallAccount = $user;

        $queryExecuted = $selectAllCardsFromWallId->execute([
            'wall_id' => $wallAccount['id']
        ]);

        $rawCards = $selectAllCardsFromWallId->fetchAll(\PDO::FETCH_ASSOC);
    } else {
        $queryExecuted = $selectAllCards->execute();

        $rawCards = $selectAllCards->fetchAll(\PDO::FETCH_ASSOC);
    }

    $debugData['queryExecuted'] = $queryExecuted;
    $debugData['totalCards'] = count($rawCards);

    $formattedCards = [];
    foreach ($rawCards as $card) {
        $formattedCards[] = [
            'id' => bin2hex($card['id']),
            'title' => $card['title'],
            'content' => $card['content'],
            'x' => (int)$card['x'],
            'y' => (int)$card['y'],
            'wall_id' => bin2hex($card['wall_id']),
            'account_id' => bin2hex($card['account_id'])
        ];
    }

    $success = true;
    Response::success(message: 'All the cards have been recovered', data: [
        'cards' => $formattedCards
    ]);
    exit;

} catch (\Exception $e) {
    $debugData['error'] = $e->getMessage();
    Response::error(message: 'Error retrieving the cards', details: json_encode($debugData));
    exit;
}