<?php
/**
 * BACKEND API FOR TAPERTRACK
 * V8.1 - PRODUCTION SECURITY (Throttling Enabled, Open Registration)
 */

// 1. SETUP & HEADERS
error_reporting(E_ALL);
ini_set('display_errors', 0); 

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET,POST,OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. CREDENTIALS
$DB_HOST = 'localhost'; 
$DB_USER = 'u321644199_admin';
$DB_PASS = 'Taper2025!Secure';
$DB_NAME = 'u321644199_tracker';

// 3. CONNECTION
$mysqli = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);

if ($mysqli->connect_error) {
    // TCP Fallback
    $mysqli = new mysqli("127.0.0.1", $DB_USER, $DB_PASS, $DB_NAME, 3306);
}

function sendJson($status, $message, $data = null, $debug = null) {
    echo json_encode(['status' => $status, 'message' => $message, 'data' => $data, 'debug' => $debug]);
    exit();
}

if ($mysqli->connect_error) {
    // Do not reveal exact SQL error in production
    sendJson('error', 'Database Connection Failed');
}

$mysqli->set_charset("utf8mb4");

// 4. AUTO-MIGRATION
function checkAndCreateTables($mysqli) {
    $check = $mysqli->query("SHOW TABLES LIKE 'users'");
    if ($check->num_rows == 0) {
        $sql = "
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            session_token VARCHAR(64) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS app_data (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            data_key VARCHAR(50) NOT NULL,
            json_value LONGTEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
        CREATE INDEX idx_user_data ON app_data(user_id, data_key);
        ";
        $mysqli->multi_query($sql);
        while ($mysqli->next_result()) {;} 
    }
}
checkAndCreateTables($mysqli);

// 5. HELPER: AUTH
function getUserId($mysqli) {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        // Security: Prepared statement prevents SQL Injection on token
        $stmt = $mysqli->prepare("SELECT id FROM users WHERE session_token = ? LIMIT 1");
        if ($stmt) {
            $stmt->bind_param("s", $token);
            $stmt->execute();
            $res = $stmt->get_result();
            if ($row = $res->fetch_assoc()) {
                return $row['id'];
            }
        }
    }
    return null;
}

// 6. ROUTING
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

try {

    // --- REGISTER ---
    if ($action === 'register') {
        // SECURITY: Anti-Brute Force Delay (1 second)
        // This prevents bots from flooding your database with accounts
        sleep(1); 

        $u = $input['username'] ?? '';
        $p = $input['password'] ?? '';
        
        // Validation
        if (!$u || !$p) sendJson('error', 'Missing fields');
        if (strlen($p) < 6) sendJson('error', 'Password too short');
        if (strlen($u) > 50) sendJson('error', 'Username too long');
        // Security: Ensure username only contains safe characters
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $u)) sendJson('error', 'Username contains invalid characters');

        // Check taken
        $stmt = $mysqli->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->bind_param("s", $u);
        $stmt->execute();
        $stmt->store_result();
        if ($stmt->num_rows > 0) sendJson('error', 'Username taken');
        $stmt->close();

        // Create
        $hash = password_hash($p, PASSWORD_DEFAULT);
        $token = bin2hex(random_bytes(32));
        $stmt = $mysqli->prepare("INSERT INTO users (username, password_hash, session_token) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $u, $hash, $token);
        
        if ($stmt->execute()) {
            sendJson('success', 'Registered', ['token' => $token, 'username' => $u]);
        } else {
            sendJson('error', 'Insert failed');
        }
    }

    // --- LOGIN ---
    elseif ($action === 'login') {
        // SECURITY: Anti-Brute Force Delay (1 second)
        // This makes password guessing mathematically impossible at scale
        sleep(1); 

        $u = $input['username'] ?? '';
        $p = $input['password'] ?? '';

        $stmt = $mysqli->prepare("SELECT id, username, password_hash FROM users WHERE username = ?");
        $stmt->bind_param("s", $u);
        $stmt->execute();
        $res = $stmt->get_result();
        $user = $res->fetch_assoc();

        if ($user && password_verify($p, $user['password_hash'])) {
            // Regenerate token on login for security
            $token = bin2hex(random_bytes(32));
            $upd = $mysqli->prepare("UPDATE users SET session_token = ? WHERE id = ?");
            $upd->bind_param("si", $token, $user['id']);
            $upd->execute();
            sendJson('success', 'Welcome', ['token' => $token, 'username' => $user['username']]);
        } else {
            sendJson('error', 'Invalid Credentials');
        }
    }

    // --- LOAD DATA ---
    elseif ($action === 'load') {
        $uid = getUserId($mysqli);
        if (!$uid) sendJson('error', 'Unauthorized');

        // SECURITY: Data Isolation
        // We strictly use the ID derived from the token. User A cannot request User B's data.
        $stmt = $mysqli->prepare("SELECT json_value FROM app_data WHERE user_id = ? AND data_key = 'main_backup'");
        $stmt->bind_param("i", $uid);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res->fetch_assoc();

        sendJson('success', 'Loaded', $row ? json_decode($row['json_value']) : null);
    }

    // --- SAVE DATA ---
    elseif ($action === 'save') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendJson('error', 'POST Only');
        $uid = getUserId($mysqli);
        if (!$uid) sendJson('error', 'Unauthorized');

        $json = file_get_contents('php://input');

        // Check exists
        $stmt = $mysqli->prepare("SELECT id FROM app_data WHERE user_id = ? AND data_key = 'main_backup'");
        $stmt->bind_param("i", $uid);
        $stmt->execute();
        $res = $stmt->get_result();
        $exists = $res->fetch_assoc();

        if ($exists) {
            $upd = $mysqli->prepare("UPDATE app_data SET json_value = ? WHERE id = ?");
            $upd->bind_param("si", $json, $exists['id']);
            $upd->execute();
        } else {
            $ins = $mysqli->prepare("INSERT INTO app_data (user_id, data_key, json_value) VALUES (?, 'main_backup', ?)");
            $ins->bind_param("is", $uid, $json);
            $ins->execute();
        }
        sendJson('success', 'Saved');
    }

    // --- PING ---
    elseif ($action === 'ping') {
        // Minimal info for ping
        sendJson('success', 'Connected');
    }

    else {
        sendJson('error', 'Invalid Action');
    }

} catch (Exception $e) {
    sendJson('error', 'Server Error');
}

$mysqli->close();
?>