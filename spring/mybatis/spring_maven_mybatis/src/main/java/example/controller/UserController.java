package example.controller;

import example.model.User;
import example.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Slf4j
@Controller
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/user")
    public String getUser(Model model, @RequestParam int id) {
        log.debug("📥 유저 조회 요청 id = {}", id);

        final User user = userService.getUser(id);
        log.info("✅ 조회된 유저: {}", user);

        model.addAttribute("user", user);
        return "userView";
    }
}
