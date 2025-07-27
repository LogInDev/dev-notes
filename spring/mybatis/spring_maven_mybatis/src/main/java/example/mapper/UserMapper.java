package example.mapper;

import example.model.User;

public interface UserMapper {
    User selectUserById(int id);
}
