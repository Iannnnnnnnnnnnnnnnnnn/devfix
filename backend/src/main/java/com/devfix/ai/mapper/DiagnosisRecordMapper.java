package com.devfix.ai.mapper;

import com.devfix.ai.domain.entity.DiagnosisRecord;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface DiagnosisRecordMapper {

    @Insert("""
            INSERT INTO diagnosis_record
            (project_name, error_type, environment, raw_log, summary, root_cause, status)
            VALUES
            (#{projectName}, #{errorType}, #{environment}, #{rawLog}, #{summary}, #{rootCause}, #{status})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(DiagnosisRecord record);

    @Select("""
            SELECT id, project_name, error_type, environment, raw_log, summary, root_cause, status, created_at, updated_at
            FROM diagnosis_record
            WHERE id = #{id}
            """)
    DiagnosisRecord findById(Long id);

    @Select("""
            SELECT id, project_name, error_type, environment, summary, root_cause, status, created_at, updated_at
            FROM diagnosis_record
            ORDER BY id DESC
            LIMIT #{limit}
            """)
    List<DiagnosisRecord> findRecent(int limit);

    @Select("SELECT COUNT(*) FROM diagnosis_record")
    long countAll();

    @Select("SELECT COUNT(*) FROM diagnosis_record WHERE DATE(created_at) = CURRENT_DATE")
    long countToday();
}
