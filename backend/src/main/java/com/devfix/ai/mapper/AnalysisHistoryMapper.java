package com.devfix.ai.mapper;

import com.devfix.ai.domain.entity.AnalysisHistory;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface AnalysisHistoryMapper {

    @Insert("""
            INSERT INTO devai_analysis_history
            (source, question, raw_content, result_json, model_name, summary, error_type)
            VALUES
            (#{source}, #{question}, #{rawContent}, #{resultJson}, #{modelName}, #{summary}, #{errorType})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(AnalysisHistory history);

    @Select("""
            SELECT id, source, question, raw_content, result_json, model_name, summary, error_type, created_at, updated_at
            FROM devai_analysis_history
            ORDER BY id DESC
            LIMIT #{limit}
            """)
    List<AnalysisHistory> findRecent(int limit);

    @Select("""
            SELECT id, source, question, raw_content, result_json, model_name, summary, error_type, created_at, updated_at
            FROM devai_analysis_history
            WHERE id = #{id}
            """)
    AnalysisHistory findById(Long id);

    @Delete("DELETE FROM devai_analysis_history WHERE id = #{id}")
    int deleteById(Long id);
}
