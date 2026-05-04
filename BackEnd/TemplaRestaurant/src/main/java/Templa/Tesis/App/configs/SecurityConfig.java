package Templa.Tesis.App.configs;

import Templa.Tesis.App.Jwt.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.stereotype.Component;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;

import java.util.Arrays;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:4200"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true); // true para JWT

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }


    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Endpoints públicos (sin autenticación)
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/sse/**",
                                "/api/mercadopago/webhook",
                                "/api/mercadopago/callback",
                                "/h2-console/**",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-resources/**",
                                "/swagger-ui.html"
                        ).permitAll()

                        //  PERSONAS - Crear cliente desde landing (permitir POST con cualquier subruta)
                        .requestMatchers(HttpMethod.POST, "/api/persona/**").permitAll()

                        //  RESERVAS - Endpoints públicos para landing
                        .requestMatchers(HttpMethod.POST, "/api/reserva/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reserva/verificar-pago/**").permitAll()

                        //  DISPONIBILIDAD - Endpoints públicos
                        .requestMatchers("/api/disponibilidad/publica/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/disponibilidad/listar").permitAll()

                        // ========================================
                        // 🔒 ENDPOINTS PROTEGIDOS
                        // ========================================

                        .requestMatchers("/api/usuario/**").hasAnyAuthority("ADMINISTRADOR","ENCARGADO")

                        // PERSONA - Proteger GET, PUT, DELETE (POST ya es público)
                        .requestMatchers(HttpMethod.GET, "/api/persona/**").hasAnyAuthority("ADMINISTRADOR","ENCARGADO")
                        .requestMatchers(HttpMethod.PUT, "/api/persona/**").hasAnyAuthority("ADMINISTRADOR","ENCARGADO")
                        .requestMatchers(HttpMethod.DELETE, "/api/persona/**").hasAnyAuthority("ADMINISTRADOR","ENCARGADO")

                        .requestMatchers("/api/producto/**").hasAnyAuthority("ADMINISTRADOR", "COCINA","ENCARGADO","MOZO")
                        .requestMatchers("/api/platos/**").hasAnyAuthority("ADMINISTRADOR","ENCARGADO","COCINA","MOZO")
                        .requestMatchers("/api/menu/**").hasAnyAuthority("ADMINISTRADOR","CLIENTE","ENCARGADO","MOZO")
                        .requestMatchers("/api/mesas/**").hasAnyAuthority("ADMINISTRADOR","MOZO","ENCARGADO")

                        // RESERVA - Proteger GET, PUT, DELETE (POST ya es público)
                        .requestMatchers(HttpMethod.GET, "/api/reserva/**").hasAnyAuthority("ADMINISTRADOR","CLIENTE","ENCARGADO")
                        .requestMatchers(HttpMethod.PUT, "/api/reserva/**").hasAnyAuthority("ADMINISTRADOR","CLIENTE","ENCARGADO")
                        .requestMatchers(HttpMethod.DELETE, "/api/reserva/**").hasAnyAuthority("ADMINISTRADOR","CLIENTE","ENCARGADO")

                        // DISPONIBILIDAD - Proteger otros endpoints
                        .requestMatchers("/api/disponibilidad/**").hasAnyAuthority("ADMINISTRADOR", "MOZO","ENCARGADO")

                        .requestMatchers("/api/pedido/**").hasAnyAuthority("ADMINISTRADOR","MOZO","COCINA","ENCARGADO")
                        .requestMatchers("/api/reportes/**").hasAuthority("ADMINISTRADOR")

                        .anyRequest().authenticated()
                )
                .headers(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
