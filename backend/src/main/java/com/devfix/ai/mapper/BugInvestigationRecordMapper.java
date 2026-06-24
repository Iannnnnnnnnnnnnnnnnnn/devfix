package com.devfix.ai.mapper;

import com.devfix.ai.domain.entity.BugInvestigationRecord;
import com.devfix.ai.dto.BugSearchResponse;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface BugInvestigationRecordMapper {
    @Insert("""
            INSERT INTO devai_bug_investigation_record
            (issue_id, project_id, source, raw_content, ai_summary, final_content, content_text, model_name)
            VALUES
            (#{issueId}, #{projectId}, #{source}, #{rawContent}, #{aiSummary}, #{finalContent}, #{contentText}, #{modelName})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(BugInvestigationRecord record);

    @Select("""
            SELECT id, issue_id, project_id, source, raw_content, ai_summary, final_content,
                   content_text, model_name, created_at, updated_at
            FROM devai_bug_investigation_record
            WHERE issue_id = #{issueId}
            ORDER BY id DESC
            """)
    List<BugInvestigationRecord> findByIssueId(Long issueId);

    @Select("""
            SELECT id, issue_id, project_id, source, raw_content, ai_summary, final_content,
                   content_text, model_name, created_at, updated_at
            FROM devai_bug_investigation_record
            WHERE id = #{id}
            """)
    BugInvestigationRecord findById(Long id);

    @Delete("DELETE FROM devai_bug_investigation_record WHERE id = #{id}")
    int deleteById(Long id);

    @Delete("DELETE FROM devai_bug_investigation_record WHERE issue_id = #{issueId}")
    int deleteByIssueId(Long issueId);

    @Select("""
            <script>
            SELECT project.id AS project_id,
                   project.name AS project_name,
                   scene.id AS scene_id,
                   scene.name AS scene_name,
                   issue.id AS issue_id,
                   issue.issue_name AS issue_name,
                   record.id AS record_id,
                   COALESCE(NULLIF(record.content_text, ''), issue.summary, issue.issue_name) AS hit_content,
                   COALESCE(record.created_at, issue.updated_at) AS record_time
            FROM devai_bug_issue issue
            JOIN devai_project project ON project.id = issue.project_id
            JOIN devai_scene scene ON scene.id = issue.scene_id
            LEFT JOIN devai_bug_investigation_record record ON record.issue_id = issue.id
            <where>
                <if test="projectId != null">AND issue.project_id = #{projectId}</if>
                <if test="sceneId != null">AND issue.scene_id = #{sceneId}</if>
                <if test="issueName != null and issueName != ''">AND issue.issue_name LIKE CONCAT('%', #{issueName}, '%')</if>
                <if test="status != null and status != ''">AND issue.status = #{status}</if>
                <if test="keyword != null and keyword != ''">
                    AND (
                        project.name LIKE CONCAT('%', #{keyword}, '%')
                        OR issue.issue_name LIKE CONCAT('%', #{keyword}, '%')
                        OR issue.summary LIKE CONCAT('%', #{keyword}, '%')
                        OR issue.error_type LIKE CONCAT('%', #{keyword}, '%')
                        OR issue.tags LIKE CONCAT('%', #{keyword}, '%')
                        OR record.raw_content LIKE CONCAT('%', #{keyword}, '%')
                        OR record.ai_summary LIKE CONCAT('%', #{keyword}, '%')
                        OR record.final_content LIKE CONCAT('%', #{keyword}, '%')
                        OR record.content_text LIKE CONCAT('%', #{keyword}, '%')
                    )
                </if>
                <if test="errorType != null and errorType != ''">AND issue.error_type LIKE CONCAT('%', #{errorType}, '%')</if>
                <if test="tag != null and tag != ''">AND issue.tags LIKE CONCAT('%', #{tag}, '%')</if>
            </where>
            ORDER BY COALESCE(record.created_at, issue.updated_at) DESC, issue.id DESC
            LIMIT #{limit} OFFSET #{offset}
            </script>
            """)
    List<BugSearchResponse.BugSearchResult> search(@Param("projectId") Long projectId,
                                                   @Param("sceneId") Long sceneId,
                                                   @Param("issueName") String issueName,
                                                   @Param("keyword") String keyword,
                                                   @Param("status") String status,
                                                   @Param("errorType") String errorType,
                                                   @Param("tag") String tag,
                                                   @Param("limit") int limit,
                                                   @Param("offset") int offset);

    @Select("""
            <script>
            SELECT COUNT(*)
            FROM devai_bug_issue issue
            JOIN devai_project project ON project.id = issue.project_id
            JOIN devai_scene scene ON scene.id = issue.scene_id
            LEFT JOIN devai_bug_investigation_record record ON record.issue_id = issue.id
            <where>
                <if test="projectId != null">AND issue.project_id = #{projectId}</if>
                <if test="sceneId != null">AND issue.scene_id = #{sceneId}</if>
                <if test="issueName != null and issueName != ''">AND issue.issue_name LIKE CONCAT('%', #{issueName}, '%')</if>
                <if test="status != null and status != ''">AND issue.status = #{status}</if>
                <if test="keyword != null and keyword != ''">
                    AND (
                        project.name LIKE CONCAT('%', #{keyword}, '%')
                        OR issue.issue_name LIKE CONCAT('%', #{keyword}, '%')
                        OR issue.summary LIKE CONCAT('%', #{keyword}, '%')
                        OR issue.error_type LIKE CONCAT('%', #{keyword}, '%')
                        OR issue.tags LIKE CONCAT('%', #{keyword}, '%')
                        OR record.raw_content LIKE CONCAT('%', #{keyword}, '%')
                        OR record.ai_summary LIKE CONCAT('%', #{keyword}, '%')
                        OR record.final_content LIKE CONCAT('%', #{keyword}, '%')
                        OR record.content_text LIKE CONCAT('%', #{keyword}, '%')
                    )
                </if>
                <if test="errorType != null and errorType != ''">AND issue.error_type LIKE CONCAT('%', #{errorType}, '%')</if>
                <if test="tag != null and tag != ''">AND issue.tags LIKE CONCAT('%', #{tag}, '%')</if>
            </where>
            </script>
            """)
    long countSearch(@Param("projectId") Long projectId,
                     @Param("sceneId") Long sceneId,
                     @Param("issueName") String issueName,
                     @Param("keyword") String keyword,
                     @Param("status") String status,
                     @Param("errorType") String errorType,
                     @Param("tag") String tag);
}
