package io.security.cors1;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class Cors1Controller {

    @GetMapping("/")
    public String index() {
        return "index";
    }

}
