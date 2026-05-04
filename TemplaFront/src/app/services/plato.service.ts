import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../componentes/models/CommonModels';
import { GetPlatoDto, PostPlatoDto } from '../componentes/models/PlatoModel';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class PlatoService {
    private readonly http: HttpClient = inject(HttpClient);
    private readonly authService = inject(AuthService);
    private readonly apiUrl = `${environment.apiUrl}/platos`;

    // ✅ Método helper para crear headers con token
    private getHttpOptions(params?: HttpParams): { headers: HttpHeaders; params?: HttpParams } {
        const token = this.authService.getToken();
        const options: any = {
            headers: new HttpHeaders({
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            })
        };

        if (params) {
            options.params = params;
        }

        return options;
    }

    getPlatosFiltrados(
        page: number = 0,
        size: number = 10,
        buscarFiltro?: string,
        tipoPlato?: string,
        estado?: string
    ): Observable<Page<GetPlatoDto>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (buscarFiltro && buscarFiltro.trim()) {
            params = params.set('buscarFiltro', buscarFiltro);
        }
        if (tipoPlato && tipoPlato !== 'TODOS') {
            params = params.set('tipoPlato', tipoPlato);
        }
        if (estado && estado !== 'TODOS') {
            params = params.set('estado', estado);
        }
        console.log('Parámetros de consulta:', params.toString());
        // ✅ Usar método helper
        return this.http.get<Page<GetPlatoDto>>(`${this.apiUrl}/filtrar`, this.getHttpOptions(params));
    }

    createPlato(plato: PostPlatoDto, imagen?: File): Observable<GetPlatoDto> {
        const formData = new FormData();

        // 🔧 Enviamos el JSON como un Blob con tipo application/json
        formData.append('plato', new Blob([JSON.stringify(plato)], { type: 'application/json' }));

        // 📸 Imagen opcional
        if (imagen) {
            formData.append('imagen', imagen, imagen.name);
        }

        const token = this.authService.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        return this.http.post<GetPlatoDto>(`${this.apiUrl}/crear`, formData, { headers });
    }

    actualizarPlato(plato: GetPlatoDto, imagen?: File): Observable<GetPlatoDto> {
        const formData = new FormData();

        formData.append('plato', new Blob([JSON.stringify(plato)], { type: 'application/json' }));

        if (imagen) {
            formData.append('imagen', imagen, imagen.name);
        }

        const token = this.authService.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        return this.http.put<GetPlatoDto>(`${this.apiUrl}/actualizar`, formData, { headers });
    }

    activarDesactivarPlato(id: number): Observable<{ mensaje: string | null }> {
        // ✅ Usar método helper
        return this.http.delete<{ mensaje: string | null }>(`${this.apiUrl}/activarDesactivarPlato/${id}`, this.getHttpOptions());
    }

    bajaPlato(id: number): Observable<void> {
        // ✅ Usar método helper
        return this.http.delete<void>(`${this.apiUrl}/borrar/${id}`, this.getHttpOptions());
    }
}
