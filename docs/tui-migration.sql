USE devfix_ai;

CREATE TABLE IF NOT EXISTS devai_analysis_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    source VARCHAR(50),
    question TEXT,
    raw_content LONGTEXT,
    result_json LONGTEXT,
    model_name VARCHAR(100),
    summary VARCHAR(500),
    error_type VARCHAR(200),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_source_created_at (source, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE devai_analysis_history
    MODIFY source VARCHAR(50),
    MODIFY question TEXT,
    MODIFY raw_content LONGTEXT,
    MODIFY result_json LONGTEXT;

DROP PROCEDURE IF EXISTS add_devai_history_column;

DELIMITER //
CREATE PROCEDURE add_devai_history_column(
    IN p_column_name VARCHAR(64),
    IN p_column_definition VARCHAR(500)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'devai_analysis_history'
          AND COLUMN_NAME = p_column_name
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE devai_analysis_history ADD COLUMN ', p_column_definition);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END//
DELIMITER ;

CALL add_devai_history_column('summary', 'summary VARCHAR(500)');
CALL add_devai_history_column('error_type', 'error_type VARCHAR(200)');
CALL add_devai_history_column('updated_at', 'updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

DROP PROCEDURE IF EXISTS add_devai_history_column;

CREATE TABLE IF NOT EXISTS devai_knowledge_doc (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    category VARCHAR(100),
    tags VARCHAR(500),
    content LONGTEXT,
    source_history_ids TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
