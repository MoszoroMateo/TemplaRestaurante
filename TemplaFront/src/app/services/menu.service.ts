import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../componentes/models/CommonModels';
import { GetMenuDTO, PostMenuDTO } from '../componentes/models/MenuModel';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class MenuService {
    private readonly http: HttpClient = inject(HttpClient);
    private readonly authService = inject(AuthService);
    private readonly apiUrl = `${environment.apiUrl}/menu`;

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

    /**
     * Obtiene todos los menús con paginación
     */
    getMenus(page: number = 0, size: number = 10): Observable<Page<GetMenuDTO>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<Page<GetMenuDTO>>(`${this.apiUrl}/menus`, this.getHttpOptions(params));
    }

    /**
     * Obtiene menús con filtros
     */
    getMenusFiltrados(
        page: number = 0,
        size: number = 10,
        buscarFiltro?: string,
        estado?: string
    ): Observable<Page<GetMenuDTO>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (buscarFiltro && buscarFiltro.trim()) {
            params = params.set('buscarFiltro', buscarFiltro);
        }
        if (estado && estado !== 'TODOS') {
            params = params.set('estado', estado);
        }

        console.log('Parámetros de consulta menú:', params.toString());
        return this.http.get<Page<GetMenuDTO>>(`${this.apiUrl}/filtrar`, this.getHttpOptions(params));
    }

    /**
     * Crea un nuevo menú
     */
    createMenu(menu: PostMenuDTO): Observable<GetMenuDTO> {
        console.log('MenuService.createMenu - Datos a enviar:', JSON.stringify(menu, null, 2));
        console.log('MenuService.createMenu - URL:', `${this.apiUrl}/crear`);
        return this.http.post<GetMenuDTO>(`${this.apiUrl}/crear`, menu, this.getHttpOptions());
    }

    /**
     * Actualiza un menú existente
     */
    actualizarMenu(menu: GetMenuDTO): Observable<GetMenuDTO> {
        return this.http.put<GetMenuDTO>(`${this.apiUrl}/actualizar`, menu, this.getHttpOptions());
    }

    /**
     * Activa o desactiva un menú
     */
    activarDesactivarMenu(id: number): Observable<{ mensaje: string | null }> {
        return this.http.put<{ mensaje: string | null }>(`${this.apiUrl}/activar-desactivar/${id}`, {}, this.getHttpOptions());
    }

    /**
     * Da de baja un menú
     */
    bajaMenu(id: number): Observable<string> {
        return this.http.delete<string>(`${this.apiUrl}/baja/${id}`, this.getHttpOptions());
    }

    /**
     * Obtiene un menú por su ID
     */
    obtenerMenuPorId(id: number): Observable<GetMenuDTO> {
        return this.http.get<GetMenuDTO>(`${this.apiUrl}/${id}`, this.getHttpOptions());
    }

    /**
     * Obtiene los detalles de un menú específico
     */
    obtenerDetallesMenu(idMenu: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/detalles/${idMenu}`, this.getHttpOptions());
    }
}