package com.devfix.ai;

import com.devfix.ai.config.DeepSeekProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(DeepSeekProperties.class)
public class DevfixAiApplication {

    public static void main(String[] args) {
        SpringApplication.run(DevfixAiApplication.class, args);
    }
}
