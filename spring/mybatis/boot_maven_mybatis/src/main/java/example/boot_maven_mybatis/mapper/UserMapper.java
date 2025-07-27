package example.boot_maven_mybatis.mapper;

import example.boot_maven_mybatis.domain.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper {
    User selectUserById(Long id);
}
