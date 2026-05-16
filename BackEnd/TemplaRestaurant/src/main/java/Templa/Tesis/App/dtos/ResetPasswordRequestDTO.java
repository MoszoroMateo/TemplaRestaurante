package Templa.Tesis.App.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResetPasswordRequestDTO {
    @Email
    @NotBlank
    private String email;
    @NotBlank
    private String token;
    @NotBlank
    private String newPassword;
}
