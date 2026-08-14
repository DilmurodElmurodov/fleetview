package org.example.b2blogistics;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@ConfigurationPropertiesScan
public class B2BLogisticsApplication {

    public static void main(String[] args) {
        SpringApplication.run(B2BLogisticsApplication.class, args);
    }
}