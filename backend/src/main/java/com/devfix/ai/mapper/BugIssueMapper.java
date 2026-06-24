package com.devfix.ai.mapper;

import com.devfix.ai.domain.entity.BugIssue;
import com.devfix.ai.dto.BugIssueTypeResponse;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface BugIssueMapper {
    @Insert("""
            INSERT INTO devai_bug_issue
            (project_id, scene_id, issue_name, status, error_type, tags, summary,
             related_log_history_ids, related_command_history_ids, related_summary_doc_ids)
            VALUES
            (#{projectId}, #{sceneId}, #{issueName}, #{status}, #{errorType}, #{tags}, #{summary},
             #{relatedLogHistoryIds}, #{relatedCommandHistoryIds}, #{relatedSummaryDocIds})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(BugIssue issue);

    @Select("""
            SELECT id, project_id, scene_id, issue_name, status, error_type, tags, summary,
                   related_log_history_ids, related_command_history_ids, related_summary_doc_ids,
                   created_at, updated_at
            FROM devai_bug_issue
            WHERE id = #{id}
            """)
    BugIssue findById(Long id);

    @Select("""
            <script>
            SELECT id, project_id, scene_id, issue_name, status, error_type, tags, summary,
                   related_log_history_ids, related_command_history_ids, related_summary_doc_ids,
                   created_at, updated_at
            FROM devai_bug_issue issue
            <where>
                <if test="projectId != null">AND issue.project_id = #{projectId}</if>
                <if test="sceneId != null">AND issue.scene_id = #{sceneId}</if>
                <if test="issueName != null and issueName != ''">AND issue.issue_name LIKE CONCAT('%', #{issueName}, '%')</if>
                <if test="status != null and status != ''">AND issue.status = #{status}</if>
                <if test="errorType != null and errorType != ''">AND issue.error_type LIKE CONCAT('%', #{errorType}, '%')</if>
                <if test="tag != null and tag != ''">AND issue.tags LIKE CONCAT('%', #{tag}, '%')</if>
                <if test="keyword != null and keyword != ''">
                    AND (
                        issue.issue_name LIKE CONCAT('%', #{keyword}, '%')
                        OR issue.summary LIKE CONCAT('%', #{keyword}, '%')
                        OR issue.error_type LIKE CONCAT('%', #{keyword}, '%')
                        OR issue.tags LIKE CONCAT('%', #{keyword}, '%')
                        OR EXISTS (
                            SELECT 1 FROM devai_bug_investigation_record record
                            WHERE record.issue_id = issue.id
                              AND (
                                  record.raw_content LIKE CONCAT('%', #{keyword}, '%')
                                  OR record.ai_summary LIKE CONCAT('%', #{keyword}, '%')
                                  OR record.final_content LIKE CONCAT('%', #{keyword}, '%')
                                  OR record.content_text LIKE CONCAT('%', #{keyword}, '%')
                              )
                        )
                    )
                </if>
            </where>
            ORDER BY issue.updated_at DESC, issue.id DESC
            LIMIT #{limit} OFFSET #{offset}
            </script>
            """)
    List<BugIssue> findPage(@Param("projectId") Long projectId,
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
            <where>
                <if test="projectId != null">AND issue.project_id = #{projectId}</if>
                <if test="sceneId != null">AND issue.scene_id = #{sceneId}</if>
                <if test="issueName != null and issueName != ''">AND issue.issue_name LIKE CONCAT('%', #{issueName}, '%')</if>
                <if test="status != null and status != ''">AND issue.status = #{status}</if>
                <if test="errorType != null and errorType != ''">AND issue.error_type LIKE CONCAT('%', #{errorType}, '%')</if>
                <if test="tag != null and tag != ''">AND issue.tags LIKE CONCAT('%', #{tag}, '%')</if>
                <if test="keyword != null and keyword != ''">
                    AND (
                        issue.issue_name LIKE CONCAT('%', #{keyword}, '%')
                        OR issue.summary LIKE CONCAT('%', #{keyword}, '%')
                        OR issue.error_type LIKE CONCAT('%', #{keyword}, '%')
                        OR issue.tags LIKE CONCAT('%', #{keyword}, '%')
                        OR EXISTS (
                            SELECT 1 FROM devai_bug_investigation_record record
                            WHERE record.issue_id = issue.id
                              AND (
                                  record.raw_content LIKE CONCAT('%', #{keyword}, '%')
                                  OR record.ai_summary LIKE CONCAT('%', #{keyword}, '%')
                                  OR record.final_content LIKE CONCAT('%', #{keyword}, '%')
                                  OR record.content_text LIKE CONCAT('%', #{keyword}, '%')
                              )
                        )
                    )
                </if>
            </where>
            </script>
            """)
    long countPage(@Param("projectId") Long projectId,
                   @Param("sceneId") Long sceneId,
                   @Param("issueName") String issueName,
                   @Param("keyword") String keyword,
                   @Param("status") String status,
                   @Param("errorType") String errorType,
                   @Param("tag") String tag);

    @Select("""
            <script>
            SELECT issue.error_type AS errorType, COUNT(*) AS count
            FROM devai_bug_issue issue
            <where>
                issue.error_type IS NOT NULL
                AND TRIM(issue.error_type) != ''
                <if test="projectId != null">AND issue.project_id = #{projectId}</if>
                <if test="sceneId != null">AND issue.scene_id = #{sceneId}</if>
            </where>
            GROUP BY issue.error_type
            ORDER BY count DESC, issue.error_type ASC
            </script>
            """)
    List<BugIssueTypeResponse> findIssueTypes(@Param("projectId") Long projectId,
                                              @Param("sceneId") Long sceneId);

    @Update("""
            UPDATE devai_bug_issue
            SET issue_name = #{issueName},
                status = #{status},
                error_type = #{errorType},
                tags = #{tags},
                summary = #{summary}
            WHERE id = #{id}
            """)
    int update(BugIssue issue);

    @Select("SELECT COUNT(*) FROM devai_bug_issue WHERE scene_id = #{sceneId}")
    long countBySceneId(Long sceneId);

    @Delete("DELETE FROM devai_bug_issue WHERE id = #{id}")
    int deleteById(Long id);
}
