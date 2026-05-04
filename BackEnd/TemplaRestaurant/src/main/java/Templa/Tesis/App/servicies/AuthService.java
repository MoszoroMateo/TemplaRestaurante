package Templa.Tesis.App.servicies;

import Templa.Tesis.App.Auth.AuthRequest;
import Templa.Tesis.App.Auth.AuthResponse;

public interface AuthService {
    AuthResponse login(AuthRequest authRequest);
}
