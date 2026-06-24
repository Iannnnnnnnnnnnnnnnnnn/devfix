package com.devfix.ai.mapper;

import com.devfix.ai.domain.entity.DevaiScene;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface DevaiSceneMapper {
    @Insert("""
            INSERT INTO devai_scene (project_id, name, description)
            VALUES (#{projectId}, #{name}, #{description})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(DevaiScene scene);

    @Select("""
            SELECT id, project_id, name, description, created_at, updated_at
            FROM devai_scene
            WHERE id = #{id}
            """)
    DevaiScene findById(Long id);

    @Select("""
            SELECT id, project_id, name, description, created_at, updated_at
            FROM devai_scene
            WHERE project_id = #{projectId}
              AND name = #{name}
            LIMIT 1
            """)
    DevaiScene findByProjectIdAndName(@Param("projectId") Long projectId, @Param("name") String name);

    @Select("""
            SELECT id, project_id, name, description, created_at, updated_at
            FROM devai_scene
            WHERE project_id = #{projectId}
            ORDER BY id ASC
            """)
    List<DevaiScene> findByProjectId(Long projectId);

    @Update("""
            UPDATE devai_scene
            SET name = #{name},
                description = #{description}
            WHERE id = #{id}
            """)
    int update(DevaiScene scene);

    @Delete("DELETE FROM devai_scene WHERE id = #{id}")
    int deleteById(Long id);
}
