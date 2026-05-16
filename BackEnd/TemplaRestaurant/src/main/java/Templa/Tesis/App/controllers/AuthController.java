package Templa.Tesis.App.controllers;

import Templa.Tesis.App.Auth.AuthRequest;
import Templa.Tesis.App.Auth.AuthResponse;
import Templa.Tesis.App.dtos.ForgotPasswordRequestDTO;
import Templa.Tesis.App.dtos.ResetPasswordRequestDTO;
import Templa.Tesis.App.dtos.VerifyTokenRequestDTO;
import Templa.Tesis.App.servicies.AuthService;
import Templa.Tesis.App.servicies.impl.PasswordResetServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetServiceImpl passwordResetService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest authRequest){
        return ResponseEntity.ok(authService.login(authRequest));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody @Valid ForgotPasswordRequestDTO requestDTO){
        passwordResetService.recoveryRequest(requestDTO);
        return ResponseEntity.ok("Recovery email sent");
    }

    @PostMapping("/verify-reset-token")
    public ResponseEntity<String> verifyResetToken(@RequestBody @Valid VerifyTokenRequestDTO requestDTO){
        passwordResetService.validateToken(requestDTO);
        return ResponseEntity.ok("Token validated");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody @Valid ResetPasswordRequestDTO requestDTO){
        passwordResetService.resetPassword(requestDTO);
        return ResponseEntity.ok("Password reset successfully");
    }


}
