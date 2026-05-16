package Templa.Tesis.App.servicies;

import Templa.Tesis.App.dtos.ForgotPasswordRequestDTO;
import Templa.Tesis.App.dtos.ResetPasswordRequestDTO;
import Templa.Tesis.App.dtos.VerifyTokenRequestDTO;

public interface IPasswordResetService {
    void recoveryRequest(ForgotPasswordRequestDTO requestDTO);
    void validateToken(VerifyTokenRequestDTO requestDTO);
    void resetPassword(ResetPasswordRequestDTO requestDTO);
}
