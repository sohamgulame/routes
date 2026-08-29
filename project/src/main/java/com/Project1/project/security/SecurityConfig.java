package com.Project1.project.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsServiceImpl userDetailsService;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter, UserDetailsServiceImpl userDetailsService) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setContentType("application/json");
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"" + authException.getMessage() + "\"}");
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        // Public Auth & WebSockets
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers("/ws-telemetry/**").permitAll()
                        .requestMatchers("/actuator/**", "/error").permitAll()

                        // Public GIS, Route Discovery, Telemetry & PDF Downloads
                        .requestMatchers(HttpMethod.GET, "/api/v1/districts/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/road-segments/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/routes/calculate").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/incidents/recent").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/incidents/report").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/convoys/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/convoys/telemetry").permitAll()
                        .requestMatchers("/api/v1/ewaybills/**").permitAll()
                        .requestMatchers("/api/v1/sitrep/**").permitAll()

                        // Role-Guarded State Command Actions
                        .requestMatchers("/api/v1/simulation/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/v1/incidents/pending-queue").hasAnyRole("ADMIN", "DISASTER_OFFICER")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/incidents/*/verify").hasAnyRole("ADMIN", "DISASTER_OFFICER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/convoys").hasAnyRole("ADMIN", "TRANSPORTER")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/convoys/**").hasAnyRole("ADMIN", "TRANSPORTER")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/convoys/**").hasAnyRole("ADMIN", "TRANSPORTER")

                        // All other API requests require genuine JWT authentication
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
