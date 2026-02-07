-- COPY ALL OF THIS AND PASTE INTO PHPMYADMIN 'SQL' TAB --

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    session_token VARCHAR(64) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create App Data Table
CREATE TABLE IF NOT EXISTS app_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    data_key VARCHAR(50) NOT NULL,
    json_value LONGTEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Optimization: Add index for faster lookups
CREATE INDEX idx_user_data ON app_data(user_id, data_key);
