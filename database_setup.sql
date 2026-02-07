-- Run this SQL command in PHPMyAdmin to set up your database table

CREATE TABLE IF NOT EXISTS app_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data_key VARCHAR(50) NOT NULL UNIQUE,
    json_value LONGTEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Initialize with empty data so the first Load works
INSERT IGNORE INTO app_data (data_key, json_value) VALUES ('main_backup', '{}');
