import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservaService } from '../../../services/reserva.service';
import { ReservaModel } from '../../models/ReservaModel';

@Component({
  selector: 'app-mp-resultado',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mp-resultado.component.html',
  styleUrl: './mp-resultado.component.css'
})
export class MpResultadoComponent implements OnInit {
  estadoPago: string = '';
  reserva: ReservaModel | null = null;
  loading: boolean = true;
  error: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservaService: ReservaService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const payment = params['payment'];
      const reservaId = params['reservaId'];

      if (payment && reservaId) {
        this.estadoPago = payment;
        console.log('💳 Resultado de MP:', { payment, reservaId });

        // Verificar estado de la reserva
        this.reservaService.verificarPagoReserva(Number(reservaId)).subscribe({
          next: (reserva) => {
            this.reserva = reserva;
            this.loading = false;
            console.log('✅ Reserva cargada:', reserva);
          },
          error: (error) => {
            console.error('❌ Error al cargar reserva:', error);
            this.error = true;
            this.loading = false;
          }
        });
      } else {
        // Sin parámetros, redirigir al home
        this.router.navigate(['/']);
      }
    });
  }

  volverAlInicio(): void {
    this.router.navigate(['/']);
  }

  get esExitoso(): boolean {
    return this.estadoPago === 'success';
  }

  get esPendiente(): boolean {
    return this.estadoPago === 'pending';
  }

  get esFallido(): boolean {
    return this.estadoPago === 'failure';
  }
}
