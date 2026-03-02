-- EduBot User Database Schema
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Insert sample users (optional)
-- INSERT INTO users (username, password) VALUES ('demo', 'demo123');
-- INSERT INTO users (username, password) VALUES ('student', 'student123');