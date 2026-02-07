<?php
/**
 * BACKEND API FOR TAPERTRACK
 * V2.3 - Robust Connection Handling
 */

// 1. DISABLE DISPLAY ERRORS FOR JSON API
error_reporting(E_ALL);
ini_set('display_errors', 0); 

// 2. CORS HEADERS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET,POST,OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- DATABASE CONFIGURATION ---
// We trim() values to remove accidental spaces from copy-pasting
$host = trim('localhost');
$db   = trim('u321644199_taper');    
$user = trim('u321644199_agon.v');   

// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
// TODO: ENSURE THIS MATCHES HOSTINGER EXACTLY
$pass = trim('!Africa95!'); 
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

$charset = 'utf8mb4';

function sendJson($status, $message, $data = null, $debug = null) {
    echo json_encode(['status' => $status, 'message' => $message, 'data' => $data, 'debug' => $debug]);
    exit();
}

try {
    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, 
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 5
    ];
    $pdo = new PDO($dsn, $user, $pass, $options);

} catch (\PDOException $e) {
    // Return connection error as JSON so the App can display it nicely
    // We explicitly state it's a DB connection error
    sendJson('error', 'Database Connection Failed', null, $e->getMessage());
}

// --- AUTHENTICATION HELPER ---
function authenticate($pdo) {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        $stmt = $pdo->prepare("SELECT id FROM users WHERE session_token = ?");
        $stmt->execute([$token]);
        $user = $stmt->fetch();
        if ($user) return $user['id'];
    }
    return null;
}

$action = $_GET['action'] ?? '';

// --- ACTIONS ---

if ($action === 'register') {
    $input = json_decode(file_get_contents('php://input'), true);
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';

    if (!$username || !$password) sendJson('error', 'Username and password required');

    // Check if username exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    if ($stmt->fetch()) sendJson('error', 'Username already taken');

    // Create User
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $token = bin2hex(random_bytes(32));

    $insert = $pdo->prepare("INSERT INTO users (username, password_hash, session_token) VALUES (?, ?, ?)");
    if ($insert->execute([$username, $hash, $token])) {
        // Initialize default data for new user
        $userId = $pdo->lastInsertId();
        sendJson('success', 'Account created', ['token' => $token, 'username' => $username]);
    } else {
        sendJson('error', 'Registration failed', null, implode(" ", $pdo->errorInfo()));
    }
}

elseif ($action === 'login') {
    $input = json_decode(file_get_contents('php://input'), true);
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';

    $stmt = $pdo->prepare("SELECT id, username, password_hash FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        $token = bin2hex(random_bytes(32));
        $update = $pdo->prepare("UPDATE users SET session_token = ? WHERE id = ?");
        $update->execute([$token, $user['id']]);
        sendJson('success', 'Welcome back', ['token' => $token, 'username' => $user['username']]);
    } else {
        sendJson('error', 'Invalid credentials');
    }
}

elseif ($action === 'load') {
    $userId = authenticate($pdo);
    if (!$userId) sendJson('error', 'Unauthorized');

    $stmt = $pdo->prepare("SELECT json_value FROM app_data WHERE user_id = ? AND data_key = 'main_backup' LIMIT 1");
    $stmt->execute([$userId]);
    $row = $stmt->fetch();

    if ($row) {
        sendJson('success', 'Data loaded', json_decode($row['json_value']));
    } else {
        sendJson('success', 'New User', ['logs' => [], 'schedule' => [], 'startDate' => '']);
    }
}

elseif ($action === 'save') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendJson('error', 'POST required');
    
    $userId = authenticate($pdo);
    if (!$userId) sendJson('error', 'Unauthorized');

    $jsonInput = file_get_contents('php://input');
    
    $check = $pdo->prepare("SELECT id FROM app_data WHERE user_id = ? AND data_key = 'main_backup'");
    $check->execute([$userId]);
    $exists = $check->fetch();

    if ($exists) {
        $stmt = $pdo->prepare("UPDATE app_data SET json_value = ? WHERE id = ?");
        $stmt->execute([$jsonInput, $exists['id']]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO app_data (user_id, data_key, json_value) VALUES (?, 'main_backup', ?)");
        $stmt->execute([$userId, $jsonInput]);
    }

    sendJson('success', 'Saved successfully');
}

else {
    sendJson('error', 'Invalid Action');
}
?>