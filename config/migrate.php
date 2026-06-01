<?php
// Run database migrations to ensure schema is up to date

function run_migrations($conn) {
    // Migration: add 'password' column to users table if it doesn't exist
    $checkColumnSql = "SELECT COUNT(*) AS col_count
                       FROM information_schema.COLUMNS
                       WHERE TABLE_SCHEMA = DATABASE()
                         AND TABLE_NAME   = 'users'
                         AND COLUMN_NAME  = 'password'";

    $result = $conn->query($checkColumnSql);
    if ($result === false) {
        die("Migration check failed: " . $conn->error);
    }

    $row = $result->fetch_assoc();
    if ((int)$row['col_count'] === 0) {
        $alterSql = "ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL";
        if ($conn->query($alterSql) === false) {
            die("Migration failed (add password column): " . $conn->error);
        }
    }
}
?>
