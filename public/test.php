<?php
// TAPERTRACK ADVANCED CONNECTION DIAGNOSTIC
// Access this file at: https://tapertrack.pixelwerk.pro/test.php

ini_set('display_errors', 1);
error_reporting(E_ALL);

// --- 1. CONFIGURATION (Must Match Hostinger EXACTLY) ---
$host = 'localhost';
$db   = 'u321644199_taper';    
$user = 'u321644199_agon.v';   
$pass = '07022026Agon';         

// Trim whitespace just in case of copy-paste errors
$host = trim($host);
$db   = trim($db);
$user = trim($user);
$pass = trim($pass);

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connection Diagnostic</title>
    <style>
        body { font-family: -apple-system, system-ui, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; background: #f5f5f5; color: #333; }
        .card { background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        h1 { margin-top: 0; font-size: 24px; }
        .status { padding: 15px; border-radius: 8px; margin-bottom: 20px; font-weight: bold; }
        .success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 14px; }
        .detail { font-size: 13px; color: #666; margin-top: 5px; }
        ul { margin: 10px 0; padding-left: 20px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>

<div class="card">
    <h1>Database Connection Test</h1>
    
    <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
        <strong>Trying to connect with:</strong><br>
        <span class="detail">User:</span> <code><?php echo htmlspecialchars($user); ?></code><br>
        <span class="detail">Database:</span> <code><?php echo htmlspecialchars($db); ?></code><br>
        <span class="detail">Password:</span> <code><?php echo substr($pass, 0, 1) . '...' . substr($pass, -1); ?></code> (<?php echo strlen($pass); ?> chars)
    </div>

    <?php
    try {
        $dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5 // 5 second timeout
        ];
        
        $start = microtime(true);
        $pdo = new PDO($dsn, $user, $pass, $options);
        $duration = round((microtime(true) - $start) * 1000, 2);

        // Success!
        echo '<div class="status success">✅ Connected Successfully!</div>';
        echo '<p class="detail">Response time: ' . $duration . 'ms</p>';
        
        // Check Tables
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        echo "<h3>Tables Found (" . count($tables) . "):</h3>";
        if (empty($tables)) {
            echo "<p>No tables found. The app will create them automatically on first run.</p>";
        } else {
            echo "<ul>";
            foreach ($tables as $t) echo "<li>" . htmlspecialchars($t) . "</li>";
            echo "</ul>";
        }
        
        echo "<hr><p><strong>Next Step:</strong> Your database connection is perfect. You can now use the app.</p>";

    } catch (PDOException $e) {
        // Failure
        echo '<div class="status error">❌ Connection Failed</div>';
        
        $msg = $e->getMessage();
        echo "<p><strong>Error Message:</strong> <br><code>" . htmlspecialchars($msg) . "</code></p>";
        
        echo "<h3>Troubleshooting Guide:</h3>";
        echo "<ul>";
        
        // Analyze Error Code
        if (strpos($msg, 'Access denied') !== false) {
            echo "<li><strong>Wrong Password or User:</strong> The server rejected the password <code>$pass</code> for user <code>$user</code>.</li>";
            echo "<li>1. Login to Hostinger Panel.</li>";
            echo "<li>2. Go to <strong>Databases</strong>.</li>";
            echo "<li>3. Find user <code>$user</code>.</li>";
            echo "<li>4. Click the three dots ⋮ and choose <strong>Change Password</strong>.</li>";
            echo "<li>5. Set the password to <code>$pass</code> exactly, or update this file.</li>";
            echo "<li><strong>Check User Permissions:</strong> Did you assign the user to the database? In Hostinger, ensure user <code>$user</code> is linked to database <code>$db</code>.</li>";
        } elseif (strpos($msg, 'Unknown database') !== false) {
            echo "<li><strong>Wrong Database Name:</strong> The database <code>$db</code> does not exist. Check for typos.</li>";
        } elseif (strpos($msg, 'host') !== false) {
            echo "<li><strong>Wrong Host:</strong> <code>localhost</code> usually works, but check if Hostinger provided a specific IP address.</li>";
        } else {
            echo "<li><strong>General Error:</strong> Check the error message above.</li>";
        }
        echo "</ul>";
    }
    ?>
</div>

</body>
</html>