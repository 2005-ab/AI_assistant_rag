package com.example.ai_assistant.controller;
import org.springframework.web.bind.annotation.*;
@RestController
public class HelloController {
    @GetMapping("/hello")
    public String hello() {
        return "Hello Abhi!";
    }

    @GetMapping("/about")
    public String about() {
        return "This is my project";
    }
    @PostMapping("/message")
    public String message(@RequestBody String message) {
        return "Received: " + message;
    }
}
