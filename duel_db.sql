-- Create the database if it doesn't exist (optional)
CREATE DATABASE IF NOT EXISTS duel_db;
USE duel_db;

-- Drop the table if it exists (for easy re-creation during development)
-- Drop the table if it exists (for easy re-creation during development)
-- Drop tables in reverse order of dependency if they exist
-- Drop tables in reverse order of dependency if they exist (for development reset)
-- Drop tables in reverse order of dependency if they exist (for development reset)
-- Create the database if it doesn't exist (optional, do this manually or via your tool)
-- CREATE DATABASE IF NOT EXISTS duel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE duel_db;

-- Drop tables in reverse order of dependency if they exist (for development reset)
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS users;

-- Create the users table
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create the tasks table with user_id foreign key
CREATE TABLE `tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `text` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `completed` tinyint(1) DEFAULT 0, -- Using TINYINT(1) for boolean
  `task_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_user_task_date` (`user_id`,`task_date`),
  CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;