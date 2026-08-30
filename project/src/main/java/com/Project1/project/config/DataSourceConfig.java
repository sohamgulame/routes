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

    @Value("${SPRING_DATASOURCE_URL:#{null}}")
    private String springDatasourceUrl;

    @Value("${AURANER_DB_HOST:#{null}}")
    private String dbHost;

    @Value("${AURANER_DB_PORT:5432}")
    private String dbPort;

    @Value("${AURANER_DB_NAME:auraner_db}")
    private String dbName;

    @Value("${AURANER_DB_USER:#{null}}")
    private String dbUser;

    @Value("${AURANER_DB_PASSWORD:#{null}}")
    private String dbPass;

    @Value("${spring.datasource.username:postgres}")
    private String username;

    @Value("${spring.datasource.password:postgrespassword}")
    private String password;

    @Bean
    @Primary
    public DataSource dataSource() {
        String rawDbUrl = databaseUrl;
        if (rawDbUrl == null || rawDbUrl.isBlank()) {
            rawDbUrl = springDatasourceUrl;
        }
        if (rawDbUrl == null || rawDbUrl.isBlank()) {
            rawDbUrl = System.getenv("DATABASE_URL");
        }
        if (rawDbUrl == null || rawDbUrl.isBlank()) {
            rawDbUrl = System.getenv("SPRING_DATASOURCE_URL");
        }

        String finalUrl = null;
        String finalUser = dbUser != null ? dbUser : username;
        String finalPass = dbPass != null ? dbPass : password;

        // 1. Check if direct host is provided (Render individual variables)
        String envHost = dbHost != null ? dbHost : System.getenv("AURANER_DB_HOST");
        if (envHost != null && !envHost.isBlank() && !envHost.equalsIgnoreCase("localhost")) {
            String envPort = dbPort != null ? dbPort : (System.getenv("AURANER_DB_PORT") != null ? System.getenv("AURANER_DB_PORT") : "5432");
            String envDb = dbName != null ? dbName : (System.getenv("AURANER_DB_NAME") != null ? System.getenv("AURANER_DB_NAME") : "auraner_db");
            finalUrl = "jdbc:postgresql://" + envHost + ":" + envPort + "/" + envDb;
            if (System.getenv("AURANER_DB_USER") != null) finalUser = System.getenv("AURANER_DB_USER");
            if (System.getenv("AURANER_DB_PASSWORD") != null) finalPass = System.getenv("AURANER_DB_PASSWORD");
        }

        // 2. If cloud platform (Render/Railway) provides DATABASE_URL connection string
        if (rawDbUrl != null && !rawDbUrl.isBlank() && (rawDbUrl.startsWith("postgres") || rawDbUrl.startsWith("jdbc:postgres"))) {
            try {
                String cleanUrl = rawDbUrl.replace("jdbc:", "");
                URI uri = new URI(cleanUrl);
                String host = uri.getHost();
                int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                String path = uri.getPath();
                String parsedDbName = (path != null && path.length() > 1) ? path.substring(1) : "auraner_db";

                if (uri.getUserInfo() != null) {
                    String[] userInfo = uri.getUserInfo().split(":");
                    finalUser = userInfo[0];
                    if (userInfo.length > 1) {
                        finalPass = userInfo[1];
                    }
                }
                finalUrl = "jdbc:postgresql://" + host + ":" + port + "/" + parsedDbName;
            } catch (Exception e) {
                System.err.println("Notice: Could not parse connection string URI: " + e.getMessage());
            }
        }

        // 3. Fallback to configured datasourceUrl or local
        if (finalUrl == null || finalUrl.isBlank()) {
            finalUrl = datasourceUrl != null ? datasourceUrl : "jdbc:postgresql://localhost:5432/auraner_db";
        }

        // Ensure standard JDBC format
        if (finalUrl.startsWith("postgres://")) {
            finalUrl = finalUrl.replace("postgres://", "jdbc:postgresql://");
        } else if (finalUrl.startsWith("postgresql://")) {
            finalUrl = finalUrl.replace("postgresql://", "jdbc:postgresql://");
        }

        System.out.println("Configuring PostgreSQL Datasource -> URL: " + finalUrl + ", User: " + finalUser);

        return DataSourceBuilder.create()
                .driverClassName("org.postgresql.Driver")
                .url(finalUrl)
                .username(finalUser)
                .password(finalPass)
                .build();
    }
}
