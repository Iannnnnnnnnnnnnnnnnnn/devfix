package com.devfix.ai.mapper;

import com.devfix.ai.domain.entity.AnalysisHistory;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;

@Mapper
public interface AnalysisHistoryMapper {

    @Insert("""
            INSERT INTO devai_analysis_history
            (source, question, raw_content, result_json, model_name)
            VALUES
            (#{source}, #{question}, #{rawContent}, #{resultJson}, #{modelName})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(AnalysisHistory history);
}
