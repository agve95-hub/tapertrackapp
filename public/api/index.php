<?php
/**
 * BACKEND API FOR TAPERTRACK
 * 
 * INSTRUCTIONS:
 * 1. Upload this file to your server (Hostinger puts it in public_html/api/index.php)
 * 2. Edit the $db, $user, and $pass variables below to match your Hostinger Database.
 */

// --- CONFIGURATION: EDIT THIS SECTION ---
$host = 'localhost';
$db   = 'u321644199_taper';    // Your Hostinger Database Name
$user = 'u321644199_agon.v';   // Your Hostinger Database Username
$pass = '!Africa95!';          // Your Database Password
$charset = 'utf8mb4';

// --- HEADERS ---
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET,POST,OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-App-Pin");

// Handle Preflight for browsers
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- DB CONNECTION ---
$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // If connection fails, return JSON error so the app knows
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed. Check config in api/index.php',
        'debug' => $e->getMessage()
    ]);
    exit();
}

// --- ROUTING ---
$action = $_GET['action'] ?? '';

// LOAD DATA
if ($action === 'load') {
    try {
        // We use a single row with key 'main_backup' to store the entire app state
        $stmt = $pdo->prepare("SELECT json_value FROM app_data WHERE data_key = 'main_backup' LIMIT 1");
        $stmt->execute();
        $row = $stmt->fetch();
        
        if ($row) {
            echo json_encode(['status' => 'success', 'data' => json_decode($row['json_value'])]);
        } else {
            // First time load, return null data
            echo json_encode(['status' => 'empty', 'data' => null]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'SQL Load Error']);
    }
} 

// SAVE DATA
elseif ($action === 'save') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        exit;
    }

    $jsonInput = file_get_contents('php://input');
    
    if (!$jsonInput) {
        echo json_encode(['status' => 'error', 'message' => 'No data received']);
        exit;
    }

    try {
        // Insert or Update the main_backup row
        $stmt = $pdo->prepare("INSERT INTO app_data (data_key, json_value) VALUES ('main_backup', ?) ON DUPLICATE KEY UPDATE json_value = ?");
        $stmt->execute([$jsonInput, $jsonInput]);
        
        echo json_encode(['status' => 'success']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'SQL Save Error', 'debug' => $e->getMessage()]);
    }
} 

else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid action parameter']);
}
?>