package com.devfix.ai.mapper;

import com.devfix.ai.domain.entity.LogAnalysisHistory;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface LogAnalysisHistoryMapper {
    @Insert("""
            INSERT INTO devai_log_analysis_history
            (project_id, scene_id, source, question, raw_content, result_json, model_name, summary, error_type, key_lines, solution)
            VALUES
            (#{projectId}, #{sceneId}, #{source}, #{question}, #{rawContent}, #{resultJson}, #{modelName}, #{summary}, #{errorType}, #{keyLines}, #{solution})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(LogAnalysisHistory history);

    @Select("""
            <script>
            SELECT id, project_id, scene_id, source, question, raw_content, result_json, model_name, summary,
                   error_type, key_lines, solution, created_at, updated_at
            FROM devai_log_analysis_history
            <where>
                <if test="projectId != null">AND project_id = #{projectId}</if>
                <if test="sceneId != null">AND scene_id = #{sceneId}</if>
                <if test="errorType != null and errorType != ''">AND error_type = #{errorType}</if>
                <if test="keyword != null and keyword != ''">
                    AND (summary LIKE CONCAT('%', #{keyword}, '%')
                         OR raw_content LIKE CONCAT('%', #{keyword}, '%')
                         OR question LIKE CONCAT('%', #{keyword}, '%'))
                </if>
                <if test="startTime != null">AND created_at &gt;= #{startTime}</if>
                <if test="endTime != null">AND created_at &lt;= #{endTime}</if>
            </where>
            ORDER BY id DESC
            LIMIT #{limit} OFFSET #{offset}
            </script>
            """)
    List<LogAnalysisHistory> findPage(@Param("projectId") Long projectId,
                                      @Param("sceneId") Long sceneId,
                                      @Param("errorType") String errorType,
                                      @Param("keyword") String keyword,
                                      @Param("startTime") LocalDateTime startTime,
                                      @Param("endTime") LocalDateTime endTime,
                                      @Param("limit") int limit,
                                      @Param("offset") int offset);

    @Select("""
            <script>
            SELECT id, project_id, scene_id, source, question, raw_content, result_json, model_name, summary,
                   error_type, key_lines, solution, created_at, updated_at
            FROM devai_log_analysis_history
            WHERE project_id = #{projectId}
            <if test="sceneId != null">AND scene_id = #{sceneId}</if>
            ORDER BY id DESC
            LIMIT #{limit}
            </script>
            """)
    List<LogAnalysisHistory> findByProjectAndScene(@Param("projectId") Long projectId,
                                                   @Param("sceneId") Long sceneId,
                                                   @Param("limit") int limit);

    @Select("SELECT COUNT(*) FROM devai_log_analysis_history WHERE scene_id = #{sceneId}")
    long countBySceneId(Long sceneId);
}
