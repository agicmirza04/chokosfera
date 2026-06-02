<?php
// Migration: ensure all required tables exist with the correct schema.
// This file is required by config/db.php and runs on every request.

// Create loyal_customers table if it does not exist
$loyalCustomersSql = "CREATE TABLE IF NOT EXISTS loyal_customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL DEFAULT '',
    last_name VARCHAR(255) NOT NULL DEFAULT '',
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) DEFAULT NULL,
    redeem_code VARCHAR(64) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

if ($conn->query($loyalCustomersSql) === false) {
    die("Migration failed (loyal_customers): " . $conn->error);
}

// Ensure password_hash column exists (handles tables created before this migration)
$checkCol = $conn->query("SHOW COLUMNS FROM loyal_customers LIKE 'password_hash'");
if ($checkCol && $checkCol->num_rows === 0) {
    $addCol = "ALTER TABLE loyal_customers ADD COLUMN password_hash VARCHAR(255) DEFAULT NULL AFTER email";
    if ($conn->query($addCol) === false) {
        die("Migration failed (add password_hash): " . $conn->error);
    }
}
?>
