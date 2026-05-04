package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.Auth.AuthRequest;
import Templa.Tesis.App.Auth.AuthResponse;
import Templa.Tesis.App.Jwt.JwtService;
import Templa.Tesis.App.repositories.UsuarioRepository;
import Templa.Tesis.App.servicies.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse login(AuthRequest request) {
        // Autenticar las credenciales
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        // Si la autenticación pasa, buscar el usuario
        var usuario = usuarioRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

        // Generar el token JWT
        var jwtToken = jwtService.generateToken(usuario);

        return AuthResponse.builder()
                .token(jwtToken)
                .build();
    }
}
