import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth-service';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs/operators';

type Screen = 'login' | 'forgot' | 'sent';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  authService = inject(AuthService);
  currentScreen: Screen = 'login';
  cdr = inject(ChangeDetectorRef);

  // Login
  username = '';
  password = '';
  isLoading = false;
  loginError = false;

  // Forgot Password
  recoveryEmail = '';
  isRecoveryLoading = false;

  // Floating label state
  usernameFocused = false;
  passwordFocused = false;
  recoveryEmailFocused = false;

  get usernameHasValue(): boolean { return this.username.length > 0; }
  get passwordHasValue(): boolean { return this.password.length > 0; }
  get recoveryEmailHasValue(): boolean { return this.recoveryEmail.length > 0; }

  login(): void {
    if (!this.username || !this.password) return;
    this.isLoading = true;

    this.authService.login({ username: this.username, password: this.password })
    .pipe(
      finalize(() => {
        this.isLoading = false; 
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: () => {
        this.isLoading = false;
        this.authService.redirectByRole();
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: 'Invalid username or password. Please try again.',
        });
      }
    });
  }

  sendRecovery(): void {
    if (!this.recoveryEmail) return;
    this.isRecoveryLoading = true;
    setTimeout(() => {
      this.isRecoveryLoading = false;
      this.goTo('sent');
    }, 1500);
  }

  goTo(screen: Screen): void {
    this.currentScreen = screen;
  }

}