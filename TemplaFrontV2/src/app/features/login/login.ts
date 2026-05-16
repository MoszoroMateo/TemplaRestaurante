import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth-service';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs/operators';
import { ForgotPasswordRequest, VerifyResetTokenRequest,ResetPasswordRequest } from '../../core/models/auth.model';

type Screen = 'login' | 'forgot' | 'sent' | 'verify-token' | 'new-password' | 'success';

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
  tokenFocused = false;
  newPasswordFocused = false;
  confirmPasswordFocused = false;

  //Token verification
  tokenDigits: string[] = ['', '', '', '', '', ''];
  isTokenLoading = false;

  //New password
  newPassword = '';
  confirmPassword = '';
  isResetLoading = false;

  get usernameHasValue(): boolean { return this.username.length > 0; }
  get passwordHasValue(): boolean { return this.password.length > 0; }
  get recoveryEmailHasValue(): boolean { return this.recoveryEmail.length > 0; }
  get tokenHasValue(): boolean { return this.tokenDigits.every(d => d !== ''); }
  get newPasswordHasValue(): boolean { return this.newPassword.length > 0; }
  get confirmPasswordHasValue(): boolean { return this.confirmPassword.length > 0; }
  get isTokenComplete(): boolean { return this.tokenDigits.every(d => d !== ''); }

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

    const request: ForgotPasswordRequest = { email: this.recoveryEmail };

    this.authService.forgotPassword(request)
      .pipe(finalize(() => {
        this.isRecoveryLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.goTo('sent');
        },
        error: (err) => {
          const msg = typeof err.error === 'string' ? err.error : 'Could not send recovery email. Please try again.';
          Swal.fire({ icon: 'error', title: 'Error', text: msg });
        }
      });
  }

  goTo(screen: Screen): void {
    this.currentScreen = screen;
  }

  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value || '';
    const sanitizedValue = rawValue.replace(/\D/g, '');

    if (!sanitizedValue) {
      this.tokenDigits[index] = '';
      input.value = '';
      return;
    }

    const digit = sanitizedValue.charAt(0);
    this.tokenDigits[index] = digit;
    input.value = digit;

    if (sanitizedValue.length > 1) {
      this.fillPastedDigits(sanitizedValue.substring(1), index + 1);
    }

    if (index < 5) {
      this.focusTokenInput(index + 1);
    }
  }

  onDigitKeydown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace' && !input.value && index > 0) {
      event.preventDefault();
      const prevInput = document.getElementById(`token-${index - 1}`) as HTMLInputElement | null;
      prevInput?.focus();
      prevInput?.select();
    }
  }

  onDigitPaste(event: ClipboardEvent, index: number): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') || '';
    const digits = pasted.replace(/\D/g, '').slice(0, 6 - index).split('');

    digits.forEach((digit, offset) => {
      this.tokenDigits[index + offset] = digit;
      const input = document.getElementById(`token-${index + offset}`) as HTMLInputElement | null;
      if (input) {
        input.value = digit;
      }
    });

    const focusIndex = Math.min(index + digits.length, 5);
    this.focusTokenInput(focusIndex);
  }

  private focusTokenInput(index: number): void {
    setTimeout(() => {
      const nextInput = document.getElementById(`token-${index}`) as HTMLInputElement | null;
      nextInput?.focus();
      nextInput?.select();
    });
  }

  private fillPastedDigits(value: string, startIndex: number): void {
    let currentIndex = startIndex;
    for (const char of value) {
      if (currentIndex > 5) {
        break;
      }
      if (!/\d/.test(char)) {
        continue;
      }
      this.tokenDigits[currentIndex] = char;
      const input = document.getElementById(`token-${currentIndex}`) as HTMLInputElement | null;
      if (input) {
        input.value = char;
      }
      currentIndex += 1;
    }
    if (currentIndex <= 5) {
      this.focusTokenInput(currentIndex);
    }
  }

  verifyToken(): void {
    if (!this.isTokenComplete) return;
    this.isTokenLoading = true;
    const token = this.tokenDigits.join('');

    const request: VerifyResetTokenRequest = {
      email: this.recoveryEmail,
      token: this.tokenDigits.join('')
    };

    this.authService.verifyResetToken(request)
      .pipe(finalize(() => {
        this.isTokenLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.goTo('new-password');
        },
        error: (err) => {
          const msg = typeof err.error === 'string' ? err.error : 'Invalid or expired code.';
          Swal.fire({ icon: 'error', title: 'Code Error', text: msg });
          this.tokenDigits = ['', '', '', '', '', ''];
          setTimeout(() => document.getElementById('token-0')?.focus(), 100);
        }
      });
  }

  resetPassword(): void {
    if (!this.newPassword || !this.confirmPassword) return;
    
    if (this.newPassword !== this.confirmPassword) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Passwords do not match.' });
      return;
    }
    
    if (this.newPassword.length < 6) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Password must be at least 6 characters.' });
      return;
    }
    
    this.isResetLoading = true;
    const token = this.tokenDigits.join('');

    const request: ResetPasswordRequest = {
      email: this.recoveryEmail,
      token: token,
      newPassword: this.newPassword
    };

    this.authService.resetPassword(request)
      .pipe(finalize(() => {
        this.isResetLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.goTo('success');
        },
        error: (err) => {
          const msg = typeof err.error === 'string' ? err.error : 'Could not reset password. Please try again.';
          Swal.fire({ icon: 'error', title: 'Error', text: msg });
        }
      });
  }

}