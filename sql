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


-- ตาราง event
CREATE TABLE event (
  EventID INT AUTO_INCREMENT PRIMARY KEY,
  EventName VARCHAR(100) NOT NULL,
  EventOrgID INT NOT NULL,
  StartDateTime DATETIME,
  EndDateTime DATETIME,
  MaxParticipant INT NULL,  -- ไม่บังคับใส่
  MaxStaff INT NULL,         -- ไม่บังคับใส่
  EventInfo TEXT,
  Location VARCHAR(255),
  Status ENUM('Draft','Pending','Approved','Rejected','Cancelled') DEFAULT 'Draft',
  ImagePath VARCHAR(255),
  FOREIGN KEY (EventOrgID) REFERENCES users(id)
);


SELECT * FROM users;
SHOW TABLES;
