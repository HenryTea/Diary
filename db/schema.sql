-- Create database if not exists
CREATE DATABASE IF NOT EXISTS diary;
USE diary;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Check if entries table exists and modify it or create new one
-- First, let's handle the existing entries table structure
DROP TABLE IF EXISTS entries_backup;

-- Create backup of existing entries if table exists
CREATE TABLE IF NOT EXISTS entries_backup AS SELECT * FROM entries WHERE 1=0;

-- Check if entries table exists and has data, back it up
INSERT IGNORE INTO entries_backup SELECT * FROM entries WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'diary' AND table_name = 'entries');

-- Drop the old entries table
DROP TABLE IF EXISTS entries;

-- Create new entries table with user relationship
CREATE TABLE entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_rich_text BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_entries_user_id ON entries(user_id);
CREATE INDEX idx_entries_date ON entries(date);

-- Insert a default admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT IGNORE INTO users (username, email, password_hash) 
VALUES ('admin', 'admin@diary.com', '$2b$10$ZqcEbjkEPuAm8WkkeVAe9.KbjMkWgfZwuvanJctoGbNVl4jV5DrPy');

-- If you had existing entries, you can manually assign them to a user
-- Uncomment and modify the following line after creating your admin user:
-- INSERT INTO entries (user_id, content, date) SELECT 1, content, date FROM entries_backup;
