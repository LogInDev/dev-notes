package example.boot_maven_mybatis.service;

import example.boot_maven_mybatis.domain.User;

public interface UserService {
    User getUserById(Long id);
}
