package com.devfix.ai.mapper;

import com.devfix.ai.domain.entity.DiagnosisResult;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface DiagnosisResultMapper {

    @Insert("""
            INSERT INTO diagnosis_result
            (diagnosis_id, evidence_json, commands_json, fix_steps_json, warnings_json, need_more_info_json)
            VALUES
            (#{diagnosisId}, #{evidenceJson}, #{commandsJson}, #{fixStepsJson}, #{warningsJson}, #{needMoreInfoJson})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(DiagnosisResult result);

    @Select("""
            SELECT id, diagnosis_id, evidence_json, commands_json, fix_steps_json, warnings_json, need_more_info_json, created_at
            FROM diagnosis_result
            WHERE diagnosis_id = #{diagnosisId}
            ORDER BY id DESC
            LIMIT 1
            """)
    DiagnosisResult findByDiagnosisId(Long diagnosisId);
}
