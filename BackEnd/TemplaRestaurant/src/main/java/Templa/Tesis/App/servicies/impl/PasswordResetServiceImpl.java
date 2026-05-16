package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.dtos.ForgotPasswordRequestDTO;
import Templa.Tesis.App.dtos.ResetPasswordRequestDTO;
import Templa.Tesis.App.dtos.VerifyTokenRequestDTO;
import Templa.Tesis.App.entities.PersonaEntity;
import Templa.Tesis.App.entities.UsuarioEntity;
import Templa.Tesis.App.repositories.PersonaRepository;
import Templa.Tesis.App.repositories.UsuarioRepository;
import Templa.Tesis.App.servicies.IPasswordResetService;
import Templa.Tesis.App.servicies.UsuarioService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class PasswordResetServiceImpl implements IPasswordResetService {
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final Map<String, ResetTokenData> tokenStore = new ConcurrentHashMap<>();
    private static final int TOKEN_EXPIRATION_MINUTES = 5;

    @Data
    @AllArgsConstructor
    private static class ResetTokenData{
        private String token;
        private LocalDateTime expiry;
        private int tries;
    }


    @Override
    public void recoveryRequest(ForgotPasswordRequestDTO requestDTO) {
        Optional<UsuarioEntity> user = usuarioRepository.findByEmail(requestDTO.getEmail());
        if (user.isEmpty()){
            throw new IllegalArgumentException("There is no account associated with that email.");
        }
        if (user.get().getActivo() != true){
            throw new IllegalStateException("The account is deactivated");
        }

        SecureRandom random = new SecureRandom();
        String token = String.format("%06d", random.nextInt(1_000_000));

        tokenStore.put(requestDTO.getEmail(),
                        new ResetTokenData(token,
                                           LocalDateTime.now().plusMinutes(TOKEN_EXPIRATION_MINUTES),
                                      0
                        )
        );
        
        emailService.sendMailRecoveryPassword(requestDTO.getEmail(),token, TOKEN_EXPIRATION_MINUTES);
    }

    @Override
    public void validateToken(VerifyTokenRequestDTO requestDTO) {
        ResetTokenData exist = tokenStore.get(requestDTO.getEmail());
        if (exist == null){
            throw new IllegalArgumentException("There is no Pending token for this email. Please, try again.");
        }

        if (exist.getExpiry().isBefore(LocalDateTime.now())){
            tokenStore.remove(requestDTO.getEmail());
            throw new IllegalStateException("The token has expired. Please, request again.");
        }

        if (exist.getTries() > 3){
            throw new IllegalArgumentException("You have run out of tries. Please, request again.");
        }

        if (!exist.getToken().equals(requestDTO.getToken())){
            exist.setTries(exist.getTries() + 1);
            throw new IllegalArgumentException("Wrong token.");
        }
    }

    @Override
    public void resetPassword(ResetPasswordRequestDTO requestDTO) {
        if (requestDTO.getNewPassword() == null ||
                requestDTO.getNewPassword().length() < 6){
            throw new IllegalArgumentException("The new Password must be 6 or more character long.");
        }

        this.validateToken(new VerifyTokenRequestDTO(requestDTO.getEmail(),
                requestDTO.getToken())
        );

        Optional<UsuarioEntity> exist = usuarioRepository.findByEmail(requestDTO.getEmail());

        if (exist.isEmpty()){
            throw new IllegalStateException("Unexpected error: the user is not found");
        }

        try{
            exist.get().setPassword(passwordEncoder.encode(requestDTO.getNewPassword()));
            usuarioRepository.save(exist.get());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        tokenStore.remove(requestDTO.getEmail());
    }

    @Scheduled(fixedRate = 60_000) // cada 60 segundos
    public void limpiarTokensExpirados() {
        tokenStore.entrySet().removeIf(entry -> entry.getValue().getExpiry().isBefore(LocalDateTime.now()));
    }
}
