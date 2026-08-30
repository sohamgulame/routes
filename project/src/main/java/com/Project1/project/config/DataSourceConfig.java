package com.Project1.project.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DataSourceConfig {

    @Value("${spring.datasource.url:#{null}}")
    private String datasourceUrl;

    @Value("${DATABASE_URL:#{null}}")
    private String databaseUrl;

    @Value("${spring.datasource.username:postgres}")
    private String username;

    @Value("${spring.datasource.password:postgrespassword}")
    private String password;

    @Bean
    @Primary
    public DataSource dataSource() {
        String finalUrl = datasourceUrl;
        String finalUser = username;
        String finalPass = password;

        // If cloud platform (Render/Railway/Heroku) provides DATABASE_URL (postgres://user:pass@host:port/db)
        if (databaseUrl != null && !databaseUrl.isBlank() && databaseUrl.startsWith("postgres")) {
            try {
                String cleanUrl = databaseUrl.replace("jdbc:", "");
                URI uri = new URI(cleanUrl);
                String host = uri.getHost();
                int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                String path = uri.getPath();
                String dbName = (path != null && path.length() > 1) ? path.substring(1) : "auraner_db";

                if (uri.getUserInfo() != null) {
                    String[] userInfo = uri.getUserInfo().split(":");
                    finalUser = userInfo[0];
                    if (userInfo.length > 1) {
                        finalPass = userInfo[1];
                    }
                }
                finalUrl = "jdbc:postgresql://" + host + ":" + port + "/" + dbName;
            } catch (Exception e) {
                System.err.println("Notice: Could not parse DATABASE_URL, falling back to standard config: " + e.getMessage());
            }
        }

        // Ensure standard JDBC format
        if (finalUrl != null && finalUrl.startsWith("postgres://")) {
            finalUrl = finalUrl.replace("postgres://", "jdbc:postgresql://");
        } else if (finalUrl != null && finalUrl.startsWith("postgresql://")) {
            finalUrl = finalUrl.replace("postgresql://", "jdbc:postgresql://");
        }

        if (finalUrl == null || finalUrl.isBlank()) {
            finalUrl = "jdbc:postgresql://localhost:5432/auraner_db";
        }

        return DataSourceBuilder.create()
                .driverClassName("org.postgresql.Driver")
                .url(finalUrl)
                .username(finalUser)
                .password(finalPass)
                .build();
    }
}
