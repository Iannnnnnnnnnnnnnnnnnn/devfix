CREATE DATABASE IF NOT EXISTS devfix_ai
    DEFAULT CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE devfix_ai;

CREATE TABLE IF NOT EXISTS diagnosis_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_name VARCHAR(100),
    error_type VARCHAR(50),
    environment VARCHAR(50),
    raw_log MEDIUMTEXT,
    summary TEXT,
    root_cause TEXT,
    status VARCHAR(30) DEFAULT 'UNRESOLVED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS diagnosis_result (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    diagnosis_id BIGINT NOT NULL,
    evidence_json JSON,
    commands_json JSON,
    fix_steps_json JSON,
    warnings_json JSON,
    need_more_info_json JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (diagnosis_id) REFERENCES diagnosis_record(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
