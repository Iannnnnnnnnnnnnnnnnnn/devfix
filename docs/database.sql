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

CREATE TABLE IF NOT EXISTS devai_project (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_devai_project_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS devai_scene (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_devai_scene_project_name (project_id, name),
    INDEX idx_scene_project_id (project_id),
    CONSTRAINT fk_scene_project FOREIGN KEY (project_id) REFERENCES devai_project(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS devai_log_analysis_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    scene_id BIGINT NOT NULL,
    source VARCHAR(50),
    question TEXT,
    raw_content LONGTEXT,
    result_json LONGTEXT,
    model_name VARCHAR(100),
    summary VARCHAR(500),
    error_type VARCHAR(200),
    key_lines LONGTEXT,
    solution LONGTEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_log_project_scene_created_at (project_id, scene_id, created_at),
    INDEX idx_log_error_type (error_type),
    CONSTRAINT fk_log_history_project FOREIGN KEY (project_id) REFERENCES devai_project(id),
    CONSTRAINT fk_log_history_scene FOREIGN KEY (scene_id) REFERENCES devai_scene(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS devai_command_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    scene_id BIGINT NOT NULL,
    environment VARCHAR(100),
    source VARCHAR(50),
    keyword VARCHAR(500),
    question TEXT,
    result_json LONGTEXT,
    model_name VARCHAR(100),
    summary VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cmd_project_scene_created_at (project_id, scene_id, created_at),
    INDEX idx_cmd_project_env_created_at (project_id, environment, created_at),
    INDEX idx_cmd_keyword (keyword),
    CONSTRAINT fk_command_history_project FOREIGN KEY (project_id) REFERENCES devai_project(id),
    CONSTRAINT fk_command_history_scene FOREIGN KEY (scene_id) REFERENCES devai_scene(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS devai_summary_doc (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    scene_id BIGINT,
    summary_type VARCHAR(50) NOT NULL,
    environment VARCHAR(100),
    title VARCHAR(255),
    content LONGTEXT,
    tags VARCHAR(500),
    source_count INT,
    source_ids LONGTEXT,
    model_name VARCHAR(100),
    import_source VARCHAR(50),
    original_file_name VARCHAR(255),
    content_hash VARCHAR(128),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_summary_project_scene_type_created_at (project_id, scene_id, summary_type, created_at),
    INDEX idx_summary_env (environment),
    INDEX idx_summary_content_hash (project_id, content_hash),
    CONSTRAINT fk_summary_doc_project FOREIGN KEY (project_id) REFERENCES devai_project(id),
    CONSTRAINT fk_summary_doc_scene FOREIGN KEY (scene_id) REFERENCES devai_scene(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS devai_bug_issue (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    scene_id BIGINT NOT NULL,
    issue_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    error_type VARCHAR(200),
    tags VARCHAR(500),
    summary VARCHAR(500),
    related_log_history_ids TEXT,
    related_command_history_ids TEXT,
    related_summary_doc_ids TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bug_issue_project_scene_updated_at (project_id, scene_id, updated_at),
    INDEX idx_bug_issue_status (status),
    INDEX idx_bug_issue_error_type (error_type),
    CONSTRAINT fk_bug_issue_project FOREIGN KEY (project_id) REFERENCES devai_project(id),
    CONSTRAINT fk_bug_issue_scene FOREIGN KEY (scene_id) REFERENCES devai_scene(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS devai_bug_investigation_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    issue_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    source VARCHAR(50),
    raw_content LONGTEXT,
    ai_summary LONGTEXT,
    final_content LONGTEXT,
    content_text LONGTEXT,
    model_name VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bug_record_issue_created_at (issue_id, created_at),
    INDEX idx_bug_record_project_created_at (project_id, created_at),
    CONSTRAINT fk_bug_record_issue FOREIGN KEY (issue_id) REFERENCES devai_bug_issue(id),
    CONSTRAINT fk_bug_record_project FOREIGN KEY (project_id) REFERENCES devai_project(id)
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
