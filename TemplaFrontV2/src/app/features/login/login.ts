import { Component, ChangeDetectorRef, inject, ElementRef, ViewChild, HostListener } from '@angular/core';
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

  @ViewChild('pinInput') pinInputRef!: ElementRef<HTMLInputElement>;
  pinFocused = false;
  activeTokenIndex = 0;

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
          confirmButtonColor: '#D93838',
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
          Swal.fire({ icon: 'error', title: 'Error', text: msg, confirmButtonColor: '#D93838' });
        }
      });
  }

  goTo(screen: Screen): void {
    this.currentScreen = screen;
  }

  @HostListener('document:keydown', ['$event'])
  onPinKeydown(e: KeyboardEvent): void {
    if (this.currentScreen !== 'verify-token' || this.isTokenLoading) return;

    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      if (this.activeTokenIndex < 6) {
        this.tokenDigits[this.activeTokenIndex] = e.key;
        if (this.activeTokenIndex < 5) this.activeTokenIndex++;
        //if (this.tokenDigits.every(d => d !== '')) this.verifyToken();
      }
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (this.tokenDigits[this.activeTokenIndex]) {
        this.tokenDigits[this.activeTokenIndex] = '';
      } else if (this.activeTokenIndex > 0) {
        this.activeTokenIndex--;
        this.tokenDigits[this.activeTokenIndex] = '';
      }
      return;
    }

    if (e.key === 'ArrowLeft' && this.activeTokenIndex > 0) { this.activeTokenIndex--; }
    if (e.key === 'ArrowRight' && this.activeTokenIndex < 5) { this.activeTokenIndex++; }
  }

  onDigitPaste(e: ClipboardEvent): void {
    e.preventDefault();
    const digits = (e.clipboardData?.getData('text') ?? '')
      .replace(/\D/g, '').slice(0, 6).split('');
    this.tokenDigits = [...digits, '', '', '', '', ''].slice(0, 6);
    this.activeTokenIndex = Math.min(digits.length, 5);
    //if (this.tokenDigits.every(d => d !== '')) this.verifyToken();
  }

  focusPin(): void {
    this.pinInputRef?.nativeElement.focus();
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
          Swal.fire({ icon: 'error', title: 'Code Error', text: msg, confirmButtonColor: '#D93838' });
          this.tokenDigits = ['', '', '', '', '', ''];
          setTimeout(() => document.getElementById('token-0')?.focus(), 100);
        }
      });
  }

  resetPassword(): void {
    if (!this.newPassword || !this.confirmPassword) return;
    
    if (this.newPassword !== this.confirmPassword) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Passwords do not match.', confirmButtonColor: '#D93838' });
      return;
    }
    
    if (this.newPassword.length < 6) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Password must be at least 6 characters.', confirmButtonColor: '#D93838' });
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
          Swal.fire({ icon: 'error', title: 'Error', text: msg, confirmButtonColor: '#D93838' });
        }
      });
  }

}