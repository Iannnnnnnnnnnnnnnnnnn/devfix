package com.devfix.ai.mapper;

import com.devfix.ai.domain.entity.DevaiProject;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface DevaiProjectMapper {
    @Insert("""
            INSERT INTO devai_project (name, description)
            VALUES (#{name}, #{description})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(DevaiProject project);

    @Select("""
            SELECT id, name, description, created_at, updated_at
            FROM devai_project
            WHERE id = #{id}
            """)
    DevaiProject findById(Long id);

    @Select("""
            SELECT id, name, description, created_at, updated_at
            FROM devai_project
            WHERE name = #{name}
            LIMIT 1
            """)
    DevaiProject findByName(String name);

    @Select("""
            SELECT id, name, description, created_at, updated_at
            FROM devai_project
            ORDER BY id ASC
            """)
    List<DevaiProject> findAll();

    @Select("SELECT COUNT(*) FROM devai_project")
    int countAll();
}
