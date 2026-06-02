<?php

require 'config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'error' => 'POST requests only'
    ]);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode([
        'success' => false,
        'error' => 'Invalid JSON'
    ]);
    exit();
}

$firstName = trim($data['firstName'] ?? '');
$lastName = trim($data['lastName'] ?? '');
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (
    empty($firstName) ||
    empty($lastName) ||
    empty($email) ||
    empty($password)
) {
    echo json_encode([
        'success' => false,
        'error' => 'All fields are required'
    ]);
    exit();
}

$check = $conn->prepare(
    "SELECT id FROM loyal_customer WHERE email = ?"
);

$check->bind_param("s", $email);
$check->execute();
$result = $check->get_result();

if ($result->num_rows > 0) {
    echo json_encode([
        'success' => false,
        'error' => 'Email already registered'
    ]);
    exit();
}

$passwordHash = password_hash(
    $password,
    PASSWORD_BCRYPT
);

$redeemCode =
    "LOYAL-" .
    strtoupper(substr(md5(uniqid()), 0, 8));

$insert = $conn->prepare(
    "INSERT INTO loyal_customer
    (first_name, last_name, email, password_hash, redeem_code)
    VALUES (?, ?, ?, ?, ?)"
);

$insert->bind_param(
    "sssss",
    $firstName,
    $lastName,
    $email,
    $passwordHash,
    $redeemCode
);

if ($insert->execute()) {

    echo json_encode([
        'success' => true,
        'redeem_code' => $redeemCode
    ]);

} else {

    echo json_encode([
        'success' => false,
        'error' => $conn->error
    ]);
}
