<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// CREDENTIALS
$db_host = 'localhost';
$db_user = 'u321644199_agon.v';
$db_pass = '07022026Agon';
$db_name = 'u321644199_taper';

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>MySQLi Diagnostic</title>
    <style>
        body { font-family: sans-serif; padding: 40px; background: #f3f4f6; }
        .card { background: white; padding: 24px; border-radius: 12px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
    </style>
</head>
<body>
    <div class="card">
        <h2>Connection Test (MySQLi)</h2>
        <p>Trying to connect to <strong><?php echo $db_host; ?></strong>...</p>
        
        <?php
        $mysqli = @new mysqli($db_host, $db_user, $db_pass, $db_name);

        if ($mysqli->connect_error) {
            echo "<p class='error'>FAILED</p>";
            echo "<p>Error Code: " . $mysqli->connect_errno . "</p>";
            echo "<p>Error Msg: " . $mysqli->connect_error . "</p>";
            
            // Try TCP fallback
            echo "<hr><p>Trying 127.0.0.1 Fallback...</p>";
            $mysqli2 = @new mysqli("127.0.0.1", $db_user, $db_pass, $db_name, 3306);
            if ($mysqli2->connect_error) {
                echo "<p class='error'>FALLBACK FAILED</p>";
                echo "<p>" . $mysqli2->connect_error . "</p>";
            } else {
                echo "<p class='success'>FALLBACK SUCCESS (127.0.0.1)</p>";
            }
        } else {
            echo "<p class='success'>SUCCESS</p>";
            echo "<p>Host Info: " . $mysqli->host_info . "</p>";
            
            // Check Tables
            $res = $mysqli->query("SHOW TABLES");
            echo "<p>Tables in DB:</p><ul>";
            while($row = $res->fetch_array()) {
                echo "<li>" . $row[0] . "</li>";
            }
            echo "</ul>";
        }
        ?>
    </div>
</body>
</html>