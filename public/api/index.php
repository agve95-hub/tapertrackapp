<?php
/**
 * BACKEND API FOR TAPERTRACK
 * V2.0 - Multi-User Support
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET,POST,OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- DB CONFIGURATION ---
$host = 'localhost';
$db   = 'u321644199_taper';    
$user = 'u321644199_agon.v';   
$pass = '!Africa95!';          
$charset = 'utf8mb4';

function sendJson($status, $message, $data = null, $debug = null) {
    echo json_encode(['status' => $status, 'message' => $message, 'data' => $data, 'debug' => $debug]);
    exit();
}

try {
    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $options = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC];
    $pdo = new PDO($dsn, $user, $pass, $options);

    // --- AUTOMATIC MIGRATION: SETUP TABLES ---
    
    // 1. Create Users Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        session_token VARCHAR(64) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // 2. Create/Update App Data Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS app_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        data_key VARCHAR(50) NOT NULL,
        json_value LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // 3. Ensure user_id column exists (Migrate old table if needed)
    try {
        $pdo->query("SELECT user_id FROM app_data LIMIT 1");
    } catch (Exception $e) {
        $pdo->exec("ALTER TABLE app_data ADD COLUMN user_id INT NULL AFTER id");
    }

} catch (\PDOException $e) {
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

// 1. REGISTER
if ($action === 'register') {
    $input = json_decode(file_get_contents('php://input'), true);
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';

    if (!$username || !$password) sendJson('error', 'Username and password required');

    // Check if exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    if ($stmt->fetch()) sendJson('error', 'Username already taken');

    // Create User
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $token = bin2hex(random_bytes(32)); // Auto-login on register

    $insert = $pdo->prepare("INSERT INTO users (username, password_hash, session_token) VALUES (?, ?, ?)");
    if ($insert->execute([$username, $hash, $token])) {
        sendJson('success', 'Account created', ['token' => $token, 'username' => $username]);
    } else {
        sendJson('error', 'Registration failed');
    }
}

// 2. LOGIN
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

// 3. LOAD DATA (Authenticated)
elseif ($action === 'load') {
    $userId = authenticate($pdo);
    if (!$userId) sendJson('error', 'Unauthorized');

    $stmt = $pdo->prepare("SELECT json_value FROM app_data WHERE user_id = ? AND data_key = 'main_backup' LIMIT 1");
    $stmt->execute([$userId]);
    $row = $stmt->fetch();

    if ($row) {
        sendJson('success', 'Data loaded', json_decode($row['json_value']));
    } else {
        // Return empty default structure if new user
        sendJson('success', 'New User', ['logs' => [], 'schedule' => [], 'startDate' => '']);
    }
}

// 4. SAVE DATA (Authenticated)
elseif ($action === 'save') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendJson('error', 'POST required');
    
    $userId = authenticate($pdo);
    if (!$userId) sendJson('error', 'Unauthorized');

    $jsonInput = file_get_contents('php://input');
    
    // Check if row exists for this user
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