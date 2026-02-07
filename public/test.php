<?php
// TAPERTRACK CONNECTION TESTER
error_reporting(E_ALL);
ini_set('display_errors', 1);

// --- CREDENTIALS FROM YOUR API FILE ---
$host = 'localhost';
$db   = 'u321644199_taper';    
$user = 'u321644199_agon.v';   
$pass = '!Africa95!'; // <--- IF THIS IS WRONG, CHANGE IT HERE TO TEST

echo "<h1>Database Connection Test</h1>";
echo "<p><strong>Host:</strong> $host</p>";
echo "<p><strong>Database:</strong> $db</p>";
echo "<p><strong>User:</strong> $user</p>";
echo "<p><strong>Password:</strong> " . substr($pass, 0, 2) . "****" . substr($pass, -2) . "</p>";

try {
    $dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2 style='color:green'>✅ CONNECTED SUCCESSFULLY</h2>";
    echo "<p>The database credentials are correct.</p>";
    
    // Test Table Access
    echo "<h3>Table Status:</h3>";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    if (empty($tables)) {
        echo "<p>No tables found. They will be created when you run the app.</p>";
    } else {
        echo "<ul>";
        foreach ($tables as $t) echo "<li>$t</li>";
        echo "</ul>";
    }

} catch (PDOException $e) {
    echo "<h2 style='color:red'>❌ CONNECTION FAILED</h2>";
    echo "<p><strong>Error Message:</strong> " . $e->getMessage() . "</p>";
    
    if (strpos($e->getMessage(), 'Access denied') !== false) {
        echo "<div style='background:#fee; padding:10px; border:1px solid red;'>";
        echo "<strong>Help:</strong> 'Access denied' means your <strong>Password</strong> is wrong.<br>";
        echo "1. Go to Hostinger -> Databases.<br>";
        echo "2. Click the 3 dots next to user <code>$user</code>.<br>";
        echo "3. Click 'Change Password'.<br>";
        echo "4. Update the password in <code>public/api/index.php</code> line 23.";
        echo "</div>";
    }
}
?>