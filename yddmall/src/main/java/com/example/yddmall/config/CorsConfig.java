package com.example.yddmall.config;

import org.springframework.lang.NonNull;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;


@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/**")          // 或者精确到 /item-sku/**
              .allowedOriginPatterns("http://localhost:[5173,5174]") // 不能用 *
              .allowedMethods("GET","POST","PUT","DELETE","OPTIONS")
              .allowedHeaders("*")
              .allowCredentials(true)      // 关键：必须 true
              .maxAge(3600);
    }
}
