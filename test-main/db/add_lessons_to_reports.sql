-- Add missing lesson fields to daily_reports table
ALTER TABLE daily_reports 
ADD COLUMN lesson1_beneficiaries INT DEFAULT 0,
ADD COLUMN lesson1_time VARCHAR(10) DEFAULT NULL,
ADD COLUMN lesson1_completed TINYINT(1) DEFAULT 0,
ADD COLUMN lesson2_beneficiaries INT DEFAULT 0,
ADD COLUMN lesson2_time VARCHAR(10) DEFAULT NULL,
ADD COLUMN lesson2_completed TINYINT(1) DEFAULT 0,
ADD COLUMN quran_session_beneficiaries INT DEFAULT 0,
ADD COLUMN quran_session_time VARCHAR(10) DEFAULT NULL,
ADD COLUMN quran_session_completed TINYINT(1) DEFAULT 0;
