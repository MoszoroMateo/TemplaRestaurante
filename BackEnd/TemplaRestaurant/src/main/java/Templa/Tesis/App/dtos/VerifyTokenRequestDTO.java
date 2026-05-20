package Templa.Tesis.App.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class VerifyTokenRequestDTO {
    @Email
    @NotBlank
    private String email;
    @NotBlank
    private String token;
}
