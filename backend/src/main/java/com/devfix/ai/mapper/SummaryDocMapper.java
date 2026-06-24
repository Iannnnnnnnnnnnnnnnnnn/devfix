package com.devfix.ai.mapper;

import com.devfix.ai.domain.entity.SummaryDoc;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface SummaryDocMapper {
    @Insert("""
            INSERT INTO devai_summary_doc
            (project_id, scene_id, summary_type, environment, title, content, tags, source_count, source_ids,
             model_name, import_source, original_file_name, content_hash)
            VALUES
            (#{projectId}, #{sceneId}, #{summaryType}, #{environment}, #{title}, #{content}, #{tags}, #{sourceCount}, #{sourceIds},
             #{modelName}, #{importSource}, #{originalFileName}, #{contentHash})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(SummaryDoc summaryDoc);

    @Select("""
            <script>
            SELECT id, project_id, scene_id, summary_type, environment, title, content, tags, source_count, source_ids,
                   model_name, import_source, original_file_name, content_hash, created_at, updated_at
            FROM devai_summary_doc
            <where>
                <if test="projectId != null">AND project_id = #{projectId}</if>
                <if test="sceneId != null">AND scene_id = #{sceneId}</if>
                <if test="type != null and type != ''">AND summary_type = #{type}</if>
                <if test="environment != null and environment != ''">AND environment = #{environment}</if>
            </where>
            ORDER BY id DESC
            LIMIT #{limit} OFFSET #{offset}
            </script>
            """)
    List<SummaryDoc> findPage(@Param("projectId") Long projectId,
                              @Param("sceneId") Long sceneId,
                              @Param("type") String type,
                              @Param("environment") String environment,
                              @Param("limit") int limit,
                              @Param("offset") int offset);

    @Select("""
            SELECT id, project_id, scene_id, summary_type, environment, title, content, tags, source_count, source_ids,
                   model_name, import_source, original_file_name, content_hash, created_at, updated_at
            FROM devai_summary_doc
            WHERE id = #{id}
            """)
    SummaryDoc findById(Long id);

    @Select("""
            <script>
            SELECT id, project_id, scene_id, summary_type, environment, title, content, tags, source_count, source_ids,
                   model_name, import_source, original_file_name, content_hash, created_at, updated_at
            FROM devai_summary_doc
            WHERE id IN
            <foreach collection="ids" item="id" open="(" separator="," close=")">
                #{id}
            </foreach>
            ORDER BY id ASC
            </script>
            """)
    List<SummaryDoc> findByIds(@Param("ids") List<Long> ids);

    @Select("""
            SELECT id, project_id, scene_id, summary_type, environment, title, content, tags, source_count, source_ids,
                   model_name, import_source, original_file_name, content_hash, created_at, updated_at
            FROM devai_summary_doc
            WHERE project_id = #{projectId}
              AND content_hash = #{contentHash}
            LIMIT 1
            """)
    SummaryDoc findDuplicate(@Param("projectId") Long projectId, @Param("contentHash") String contentHash);

    @Select("SELECT COUNT(*) FROM devai_summary_doc WHERE scene_id = #{sceneId}")
    long countBySceneId(Long sceneId);

    @Delete("DELETE FROM devai_summary_doc WHERE id = #{id}")
    int deleteById(Long id);
}
