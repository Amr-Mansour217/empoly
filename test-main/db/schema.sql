-- Create the database
CREATE DATABASE IF NOT EXISTS employee_tracker;
USE employee_tracker;

-- Users table (for all user types)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  nationality VARCHAR(50),
  location VARCHAR(100),
  role ENUM('admin', 'supervisor', 'employee') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Supervisor-Employee relationship
CREATE TABLE IF NOT EXISTS employee_supervisors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  supervisor_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_employee_supervisor (employee_id)
);

-- Activity types
CREATE TABLE IF NOT EXISTS activity_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily reports
CREATE TABLE IF NOT EXISTS daily_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  activity_type_id INT NOT NULL,
  beneficiaries_count INT NOT NULL,
  location VARCHAR(100),
  report_date DATE NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (activity_type_id) REFERENCES activity_types(id) ON DELETE CASCADE,
  UNIQUE KEY unique_employee_date (employee_id, report_date)
);

-- Attendance records (automatically generated)
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('present', 'absent') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_employee_date (employee_id, date)
);

-- Insert default activity types
INSERT INTO activity_types (name) VALUES 
  ('نشاط دعوي'),
  ('تصحيح تلاوة'),
  ('درس علمي'),
  ('غيره');

-- Create admin user (password: admin123)
INSERT INTO users (username, password, full_name, role)
VALUES ('admin', '$2b$10$rNC7OqI.Jy.OMa4.XLzHd.FfgN8jlzRlX9yw8tg9FUOgZQ1.wMTjq', 'Admin User', 'admin'); 