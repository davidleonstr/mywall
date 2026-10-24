<?php
use indura\db\mysql\MySQL;

require ROOTPATH . '/app/constants/database.php';

$db = new MySQL(
    dbname: $DBNAME,
    host: $HOST,
    password: $PASSWORD,
    port: $PORT,
    username: $USERNAME
);

$cursor = $db->getConnection();