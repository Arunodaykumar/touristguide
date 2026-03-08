package com.touristguide;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.CrossOrigin;

@SpringBootApplication
@CrossOrigin(origins = "*")
public class TouristGuideApplication {
    public static void main(String[] args) {
        SpringApplication.run(TouristGuideApplication.class, args);
    }
}