<?php
/**
 * BACKEND API FOR TAPERTRACK
 * Updated: Self-Healing & Debugging
 */

// Disable HTML error output, we want JSON only
error_reporting(E_ALL);
ini_set('display_errors', 0);
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET,POST,OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-App-Pin");

// Handle Preflight
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- CONFIGURATION ---
$host = 'localhost';
$db   = 'u321644199_taper';    
$user = 'u321644199_agon.v';   
$pass = '!Africa95!';          
$charset = 'utf8mb4';

// Helper to return JSON and exit
function sendJson($status, $message, $data = null, $debug = null) {
    // Always return 200 OK so the frontend can read the JSON error message
    http_response_code(200);
    echo json_encode([
        'status' => $status,
        'message' => $message,
        'data' => $data,
        'debug' => $debug
    ]);
    exit();
}

try {
    // 1. Connect to Database
    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, $user, $pass, $options);

    // 2. SELF-HEALING: Check if table exists, if not, create it
    // This prevents "Table not found" errors if SQL wasn't run
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'app_data'");
    if ($tableCheck->rowCount() == 0) {
        $pdo->exec("CREATE TABLE app_data (
            id INT AUTO_INCREMENT PRIMARY KEY,
            data_key VARCHAR(50) NOT NULL UNIQUE,
            json_value LONGTEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )");
        // Insert default empty row
        $pdo->exec("INSERT IGNORE INTO app_data (data_key, json_value) VALUES ('main_backup', '{}')");
    }

} catch (\PDOException $e) {
    sendJson('error', 'Database Connection Failed. Check your Hostinger DB password/username.', null, $e->getMessage());
}

// --- ROUTING ---
$action = $_GET['action'] ?? '';

// LOAD DATA
if ($action === 'load') {
    try {
        $stmt = $pdo->prepare("SELECT json_value FROM app_data WHERE data_key = 'main_backup' LIMIT 1");
        $stmt->execute();
        $row = $stmt->fetch();
        
        if ($row) {
            sendJson('success', 'Data loaded', json_decode($row['json_value']));
        } else {
            sendJson('empty', 'No data found', null);
        }
    } catch (Exception $e) {
        sendJson('error', 'SQL Load Failed', null, $e->getMessage());
    }
} 

// SAVE DATA
elseif ($action === 'save') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendJson('error', 'Method not allowed (Use POST)');
    }

    $jsonInput = file_get_contents('php://input');
    
    if (!$jsonInput) {
        sendJson('error', 'No JSON data received');
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO app_data (data_key, json_value) VALUES ('main_backup', ?) ON DUPLICATE KEY UPDATE json_value = ?");
        $stmt->execute([$jsonInput, $jsonInput]);
        sendJson('success', 'Saved successfully');
    } catch (Exception $e) {
        sendJson('error', 'SQL Save Failed', null, $e->getMessage());
    }
} 

else {
    sendJson('error', 'Invalid Action');
}
?>