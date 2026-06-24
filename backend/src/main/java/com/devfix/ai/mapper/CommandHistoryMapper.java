package com.devfix.ai.mapper;

import com.devfix.ai.domain.entity.CommandHistory;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface CommandHistoryMapper {
    @Insert("""
            INSERT INTO devai_command_history
            (project_id, scene_id, environment, source, keyword, question, result_json, model_name, summary)
            VALUES
            (#{projectId}, #{sceneId}, #{environment}, #{source}, #{keyword}, #{question}, #{resultJson}, #{modelName}, #{summary})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(CommandHistory history);

    @Select("""
            <script>
            SELECT id, project_id, scene_id, environment, source, keyword, question, result_json, model_name,
                   summary, created_at, updated_at
            FROM devai_command_history
            <where>
                <if test="projectId != null">AND project_id = #{projectId}</if>
                <if test="sceneId != null">AND scene_id = #{sceneId}</if>
                <if test="environment != null and environment != ''">AND environment = #{environment}</if>
                <if test="keyword != null and keyword != ''">
                    AND (keyword LIKE CONCAT('%', #{keyword}, '%')
                         OR question LIKE CONCAT('%', #{keyword}, '%')
                         OR summary LIKE CONCAT('%', #{keyword}, '%'))
                </if>
                <if test="startTime != null">AND created_at &gt;= #{startTime}</if>
                <if test="endTime != null">AND created_at &lt;= #{endTime}</if>
            </where>
            ORDER BY id DESC
            LIMIT #{limit} OFFSET #{offset}
            </script>
            """)
    List<CommandHistory> findPage(@Param("projectId") Long projectId,
                                  @Param("sceneId") Long sceneId,
                                  @Param("environment") String environment,
                                  @Param("keyword") String keyword,
                                  @Param("startTime") LocalDateTime startTime,
                                  @Param("endTime") LocalDateTime endTime,
                                  @Param("limit") int limit,
                                  @Param("offset") int offset);

    @Select("""
            <script>
            SELECT id, project_id, scene_id, environment, source, keyword, question, result_json, model_name,
                   summary, created_at, updated_at
            FROM devai_command_history
            WHERE project_id = #{projectId}
            <if test="sceneId != null">AND scene_id = #{sceneId}</if>
            ORDER BY id DESC
            LIMIT #{limit}
            </script>
            """)
    List<CommandHistory> findByProjectAndScene(@Param("projectId") Long projectId,
                                               @Param("sceneId") Long sceneId,
                                               @Param("limit") int limit);

    @Select("SELECT COUNT(*) FROM devai_command_history WHERE scene_id = #{sceneId}")
    long countBySceneId(Long sceneId);
}
