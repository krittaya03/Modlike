CREATE DATABASE modlike;
USE modlike;


CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE,
  name VARCHAR(100),
  email VARCHAR(100),
  role ENUM('user','admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


SELECT * FROM users;
SHOW TABLES;
