package example.boot_maven_mybatis.service;

import example.boot_maven_mybatis.domain.User;
import example.boot_maven_mybatis.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserMapper userMapper;


    @Override
    public User getUserById(Long id) {
        return userMapper.selectUserById(id);
    }
}
