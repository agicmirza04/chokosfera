<?php
// Database configuration - supports Railway or local MySQL
$db_host = getenv('RAILWAY_DB_HOST') ?: 'localhost';
$db_port = getenv('RAILWAY_DB_PORT') ?: 3306;
$db_user = getenv('RAILWAY_DB_USER') ?: 'root';
$db_pass = getenv('RAILWAY_DB_PASSWORD') ?: '';
$db_name = getenv('RAILWAY_DB_NAME') ?: 'chokosfera';

// Create connection to MySQL server (database may not exist yet)
$conn = new mysqli($db_host . ':' . $db_port, $db_user, $db_pass);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Create database if it does not exist
$dbCreated = $conn->query("CREATE DATABASE IF NOT EXISTS `" . $db_name . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
if ($dbCreated === false) {
    die("Database creation failed: " . $conn->error);
}

// Select the database
$conn->select_db($db_name);

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