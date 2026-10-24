CREATE DATABASE mywall;

USE mywall;

CREATE TABLE accounts (
    id BINARY(16) DEFAULT (UUID_TO_BIN(UUID())) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    root BOOLEAN DEFAULT FALSE
);

CREATE TABLE cards (
    id BINARY(16) DEFAULT (UUID_TO_BIN(UUID())) PRIMARY KEY,
    title VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    x int NOT NULL,
    y int NOT NULL,
    
    wall_id BINARY(16) NOT NULL,
    FOREIGN KEY (wall_id) REFERENCES accounts(id),

    account_id BINARY(16) NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);