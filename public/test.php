<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// NEW CREDENTIALS
// Matches public/api/index.php
$db_host = 'localhost';
$db_user = 'u321644199_admin';
$db_pass = 'Taper2025!Secure';
$db_name = 'u321644199_tracker';

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Config Check</title>
    <style>
        body { font-family: sans-serif; padding: 40px; background: #f3f4f6; }
        .card { background: white; padding: 24px; border-radius: 12px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .success { color: green; font-weight: bold; background: #dcfce7; padding: 4px 8px; border-radius: 4px; }
        .error { color: red; font-weight: bold; background: #fee2e2; padding: 4px 8px; border-radius: 4px; }
        code { background: #eee; padding: 2px 5px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="card">
        <h2>Configuration Check</h2>
        <p>This script tests the new credentials you requested.</p>
        
        <div style="background:#eff6ff; padding:15px; border-radius:8px; margin-bottom:20px; font-size:14px;">
            <strong>Expected Hostinger Setup:</strong><br>
            Database Name: <code><?php echo $db_name; ?></code><br>
            Database User: <code><?php echo $db_user; ?></code><br>
            Password: <code><?php echo $db_pass; ?></code>
        </div>

        <?php
        // Try Standard Connection
        echo "<div>Connecting via <strong>localhost</strong>... ";
        $mysqli = @new mysqli($db_host, $db_user, $db_pass, $db_name);

        if ($mysqli->connect_error) {
            echo "<span class='error'>FAILED</span>";
            echo "<div style='font-size:12px; margin-top:5px; color:#666;'>" . $mysqli->connect_error . "</div>";
            
            // Try Fallback
            echo "<div style='margin-top:10px;'>Connecting via <strong>127.0.0.1</strong>... ";
            $mysqli2 = @new mysqli("127.0.0.1", $db_user, $db_pass, $db_name, 3306);
            if ($mysqli2->connect_error) {
                 echo "<span class='error'>FAILED</span>";
                 echo "<div style='font-size:12px; margin-top:5px; color:#666;'>" . $mysqli2->connect_error . "</div>";
                 echo "<p style='color:red; margin-top:15px;'><strong>Action Required:</strong> Please go to your Hostinger dashboard and create the database and user exactly as shown above.</p>";
            } else {
                 echo "<span class='success'>SUCCESS</span></div>";
                 echo "<p>Connected via TCP/IP.</p>";
            }
        } else {
            echo "<span class='success'>SUCCESS</span></div>";
            echo "<p>Connected via Socket.</p>";
            
            // Check Tables
            $res = $mysqli->query("SHOW TABLES");
            $tables = [];
            while($row = $res->fetch_array()) $tables[] = $row[0];
            
            echo "<p><strong>Tables found:</strong> " . (count($tables) > 0 ? implode(", ", $tables) : "None (App will create them)") . "</p>";
        }
        ?>
    </div>
</body>
</html>