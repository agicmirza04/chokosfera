<?php
// Database configuration - supports Railway or local MySQL
$dbUrl = getenv('DATABASE_URL') ?: getenv('MYSQL_URL') ?: getenv('CLEARDB_DATABASE_URL') ?: getenv('RAILWAY_DATABASE_URL');
$db_host = getenv('RAILWAY_DB_HOST') ?: getenv('MYSQL_HOST') ?: getenv('DB_HOST') ?: 'localhost';
$db_port = getenv('RAILWAY_DB_PORT') ?: getenv('MYSQL_PORT') ?: getenv('DB_PORT') ?: 3306;
$db_user = getenv('RAILWAY_DB_USER') ?: getenv('MYSQL_USER') ?: getenv('DB_USER') ?: 'root';
$db_pass = getenv('RAILWAY_DB_PASSWORD') ?: getenv('MYSQL_PASSWORD') ?: getenv('DB_PASS') ?: '';
$db_name = getenv('RAILWAY_DB_NAME') ?: getenv('MYSQL_DATABASE') ?: getenv('DB_NAME') ?: 'chokosfera';

if ($dbUrl) {
    $parsed = parse_url($dbUrl);
    if ($parsed !== false) {
        if (!empty($parsed['host'])) $db_host = $parsed['host'];
        if (!empty($parsed['port'])) $db_port = $parsed['port'];
        if (!empty($parsed['user'])) $db_user = $parsed['user'];
        if (!empty($parsed['pass'])) $db_pass = $parsed['pass'];
        if (!empty($parsed['path'])) $db_name = ltrim($parsed['path'], '/');
    }
}

// Create connection to MySQL server
$conn = new mysqli($db_host, $db_user, $db_pass, $db_name, $db_port);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Create users table if it does not exist
$tableSql = "CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

if ($conn->query($tableSql) === false) {
    die("Table creation failed: " . $conn->error);
}

// Set charset
$conn->set_charset("utf8mb4");
?>