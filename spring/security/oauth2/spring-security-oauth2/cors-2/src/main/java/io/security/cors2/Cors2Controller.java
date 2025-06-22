package io.security.cors2;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class Cors2Controller {

    @GetMapping("/users")
    public User users(){
        return new User("user", 20);
    }
}
