-- Face Recognition Database Schema
-- Add this to your existing HRMS database

-- Table to store face embeddings for employees
CREATE TABLE IF NOT EXISTS `face_embeddings` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `face_descriptor` longtext NOT NULL COMMENT 'JSON array of face descriptor values',
  `registered_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_employee` (`employee_id`),
  KEY `idx_org` (`org_id`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add face-related fields to attendances table if not exists
-- ALTER TABLE `attendances` ADD COLUMN `face_match_score` decimal(5,4) DEFAULT NULL AFTER `biometric_ref`;
-- ALTER TABLE `attendances` ADD COLUMN `face_verified` tinyint(1) DEFAULT 0 AFTER `face_match_score`;

-- Sample data for testing (will be populated by the system)
-- INSERT INTO `face_embeddings` (`employee_id`, `org_id`, `face_descriptor`) VALUES (4, 3, '[]');

-- View for face attendance logs
CREATE OR REPLACE VIEW `face_attendance_view` AS
SELECT 
    a.id,
    a.employee_id,
    e.first_name,
    e.last_name,
    e.email,
    a.attendance_date,
    a.check_in,
    a.check_out,
    a.status,
    a.source,
    a.face_match_score,
    a.face_verified,
    a.created_at
FROM `attendances` a
LEFT JOIN `employees` e ON a.employee_id = e.id
WHERE a.source = 'face';

-- Stored procedure to register face
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS `register_face_embedding`(
    IN p_employee_id INT,
    IN p_org_id INT,
    IN p_face_descriptor TEXT
)
BEGIN
    INSERT INTO `face_embeddings` (`employee_id`, `org_id`, `face_descriptor`)
    VALUES (p_employee_id, p_org_id, p_face_descriptor)
    ON DUPLICATE KEY UPDATE 
        `face_descriptor` = p_face_descriptor,
        `updated_at` = CURRENT_TIMESTAMP,
        `is_active` = 1;
END$$
DELIMITER ;

-- Stored procedure to get face embedding
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS `get_face_embedding`(
    IN p_employee_id INT
)
BEGIN
    SELECT id, employee_id, face_descriptor, registered_at
    FROM face_embeddings
    WHERE employee_id = p_employee_id AND is_active = 1;
END$$
DELIMITER ;

-- Stored procedure to delete face embedding
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS `delete_face_embedding`(
    IN p_employee_id INT
)
BEGIN
    UPDATE face_embeddings 
    SET is_active = 0 
    WHERE employee_id = p_employee_id;
END$$
DELIMITER ;

