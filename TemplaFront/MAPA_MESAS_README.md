# 🗺️ Componente Mapa de Mesas - Documentación

## 📋 Descripción General

El componente `MapaMesasComponent` es una interfaz interactiva para gestionar visualmente las mesas del restaurante sobre planos de diferentes pisos. Permite visualizar el estado de las mesas en tiempo real, cambiar estados, crear pedidos y configurar la disposición física de las mesas.

---

## ✨ Características Implementadas

### 1. **Visualización de Planos Multi-Piso**
- ✅ Sistema de tabs para cambiar entre pisos (Principal, Planta Alta, VIP)
- ✅ Carga dinámica de imágenes de planos desde `assets/imagenes/`
- ✅ Contador de mesas por piso en tiempo real

### 2. **Gestión Visual de Mesas**
- ✅ Círculos interactivos representando mesas
- ✅ Código de colores por estado:
  - 🟢 **Verde**: DISPONIBLE
  - ⚫ **Gris**: OCUPADA
  - 🟡 **Amarillo**: RESERVADA
  - 🔴 **Rojo**: FUERA_SERVICIO

### 3. **Modo Configuración** (Solo Roles Autorizados)
- ✅ Toggle para activar/desactivar modo configuración
- ✅ Validación de roles: ADMINISTRADOR, ENCARGADO, MOZO
- ✅ Panel lateral con lista de mesas disponibles
- ✅ Drag & Drop desde panel lateral al plano
- ✅ Búsqueda de mesas por número
- ✅ Indicador visual de mesas ya vinculadas

### 4. **Zoom y Navegación**
- ✅ Controles de zoom (+/-) con botones
- ✅ Zoom con scroll del mouse (rueda)
- ✅ Pan/desplazamiento arrastrando con el mouse
- ✅ Botón para resetear vista
- ✅ Indicador de nivel de zoom en tiempo real

### 5. **Menú Contextual Interactivo**
- ✅ Click en mesa para abrir menú
- ✅ Cambio rápido de estado (4 opciones)
- ✅ Botón para crear pedido (abre modal)
- ✅ Opción para desvincular mesa (solo en modo configuración)
- ✅ Cierre automático al hacer click fuera

### 6. **Integración con Sistema de Pedidos**
- ✅ Abre `PedidoModalComponent` desde el menú contextual
- ✅ Pasa automáticamente la mesa seleccionada
- ✅ Detecta ID del mozo desde usuario logueado
- ✅ Cambia estado de mesa a OCUPADA tras crear pedido

### 7. **Persistencia de Datos**
- ✅ Almacenamiento local (localStorage) de posiciones
- ✅ Métodos preparados para conectar con backend
- ✅ Sistema de guardado automático al mover mesas
- ✅ Carga de configuración al iniciar componente

### 8. **Compatibilidad Táctil**
- ✅ HTML5 Drag & Drop (compatible con touch)
- ✅ Diseño responsive para tablets y móviles
- ✅ Gestos de zoom y pan optimizados

---

## 🏗️ Estructura del Componente

### Archivos Principales
```
src/app/componentes/modulos/mapa-mesas/
├── mapa-mesas.component.ts       # Lógica del componente
├── mapa-mesas.component.html     # Template con estructura visual
├── mapa-mesas.component.css      # Estilos completos
└── mapa-mesas.component.spec.ts  # Tests (por implementar)
```

### Modelos Modificados
```typescript
// src/app/componentes/models/MesasModel.ts
export interface GetMesaDto {
    idMesa: number;
    numeroMesa: string;
    estadoMesa: EstadoMesa;
    posX?: number;      // ✅ NUEVO
    posY?: number;      // ✅ NUEVO
    piso?: number;      // ✅ NUEVO
}
```

### Servicios Actualizados
```typescript
// src/app/services/mesa.service.ts
✅ actualizarPosicionMesa()     // Guardar coordenadas (mock)
✅ getMesasConPosiciones()       // Obtener mesas con posiciones (mock)
✅ desvincularMesaDelPlano()     // Eliminar vinculación (mock)
```

---

## 🚀 Cómo Usar el Componente

### 1. **Modo Normal (Visualización)**

#### Ver Estado de Mesas
1. Selecciona el piso en los tabs superiores
2. Observa los círculos coloreados según estado
3. Usa zoom para acercarte o alejarte
4. Arrastra el mapa para desplazarte (pan)

#### Interactuar con una Mesa
1. Haz **click** en un círculo de mesa
2. Se abrirá un menú contextual con opciones:
   - Cambiar estado (4 opciones)
   - Crear pedido (si está DISPONIBLE)

#### Crear Pedido
1. Click en mesa DISPONIBLE
2. Selecciona "Crear Pedido"
3. Se abre el modal de pedidos automáticamente
4. La mesa y mozo se asignan automáticamente

---

### 2. **Modo Configuración** (Solo Roles Autorizados)

#### Activar Modo Configuración
1. Verifica que tu usuario tenga rol: ADMINISTRADOR, ENCARGADO o MOZO
2. Activa el toggle "Configuración ON" en el header

#### Vincular Mesa al Plano
1. En el panel lateral izquierdo, busca la mesa
2. **Arrastra** la mesa desde el panel
3. **Suelta** sobre el plano en la posición deseada
4. La mesa queda vinculada y se guarda automáticamente

#### Reposicionar Mesa Existente
1. En modo configuración, arrastra el círculo de la mesa
2. Suéltalo en la nueva posición
3. Se guarda automáticamente

#### Desvincular Mesa
1. Click derecho en la mesa
2. Selecciona "Desvincular del Plano"
3. La mesa desaparece del mapa pero sigue existiendo en el sistema

---

## 🔧 Configuración Técnica

### Imágenes de Planos
Ubicación: `src/assets/imagenes/`
```
✅ Planos-Principal.png  → Piso 0
✅ Planos-pAlta.png      → Piso 1
✅ MesaVip.png           → Piso 2 (VIP)
```

Para agregar más pisos, edita el array en el componente:
```typescript
// mapa-mesas.component.ts
pisos: Piso[] = [
  { numero: 0, nombre: 'Principal', imagenUrl: 'assets/imagenes/Planos-Principal.png' },
  { numero: 1, nombre: 'Planta Alta', imagenUrl: 'assets/imagenes/Planos-pAlta.png' },
  { numero: 2, nombre: 'VIP', imagenUrl: 'assets/imagenes/MesaVip.png' },
  // Agrega más pisos aquí
];
```

### Persistencia de Datos
**Actual**: localStorage (desarrollo)
```typescript
// Clave utilizada
localStorage.getItem('mesas_posiciones')
```

**Futuro**: Backend (cuando esté disponible)
- Descomentar llamadas HTTP en `mesa.service.ts`
- Endpoints necesarios:
  - `PUT /api/mesas/actualizarPosicion`
  - `GET /api/mesas/posiciones`
  - `DELETE /api/mesas/desvincular/{id}`

---

## 🎨 Personalización de Estilos

### Colores de Estados
Edita en `mapa-mesas.component.ts`:
```typescript
getColorMesa(estado: EstadoMesa): string {
  switch (estado) {
    case EstadoMesa.DISPONIBLE:     return '#28a745'; // Verde
    case EstadoMesa.OCUPADA:        return '#6c757d'; // Gris
    case EstadoMesa.RESERVADA:      return '#ffc107'; // Amarillo
    case EstadoMesa.FUERA_SERVICIO: return '#dc3545'; // Rojo
  }
}
```

### Tamaño de Círculos de Mesas
Edita en `mapa-mesas.component.css`:
```css
.mesa-circulo {
  width: 50px;   /* Cambiar tamaño */
  height: 50px;
}
```

---

## 🔐 Control de Acceso

### Roles con Acceso al Modo Configuración
```typescript
const rolesPermitidos = ['ADMINISTRADOR', 'ENCARGADO', 'MOZO'];
```

Para cambiar roles, edita en `verificarPermisos()`:
```typescript
verificarPermisos(): void {
  const userInfo = this.authService.getUserInfo();
  if (userInfo && userInfo.rol) {
    const rolesPermitidos = ['TU_ROL_AQUI'];
    this.puedeConfigurar = rolesPermitidos.includes(userInfo.rol);
  }
}
```

---

## 📱 Responsive Design

### Breakpoints
- **Desktop**: `> 1024px` → Vista completa con panel lateral
- **Tablet**: `768px - 1024px` → Panel lateral estrecho
- **Mobile**: `< 768px` → Panel lateral oculto por defecto (toggle)

---

## 🐛 Solución de Problemas

### Las mesas no se cargan
1. Verifica que existan mesas en el sistema (componente mesas)
2. Revisa localStorage: `localStorage.getItem('mesas_posiciones')`
3. Abre la consola del navegador para ver errores

### No puedo activar modo configuración
1. Verifica tu rol de usuario
2. Debe ser: ADMINISTRADOR, ENCARGADO o MOZO
3. Revisa el token JWT decodificado

### El zoom no funciona
1. Verifica que el evento `(wheel)` esté correctamente bindeado
2. Prueba con los botones +/- en lugar del scroll

### Las coordenadas no se guardan
1. Actualmente usan localStorage (desarrollo)
2. Para producción, implementa los endpoints en backend
3. Descomentar llamadas HTTP en `mesa.service.ts`

---

## 🚧 TODOs / Mejoras Futuras

### Backend
- [ ] Implementar endpoint `PUT /api/mesas/actualizarPosicion`
- [ ] Implementar endpoint `GET /api/mesas/posiciones`
- [ ] Implementar endpoint `DELETE /api/mesas/desvincular/{id}`
- [ ] Agregar campos `posX`, `posY`, `piso` a la entidad Mesa en base de datos

### Funcionalidades
- [ ] Drag con touch mejorado para móviles
- [ ] Historial de cambios de estado
- [ ] Notificaciones en tiempo real (WebSocket)
- [ ] Exportar/importar configuración de mesas
- [ ] Vista 3D opcional
- [ ] Filtros por estado en vista de mapa
- [ ] Medidor de distancias entre mesas

### UX/UI
- [ ] Tutorial interactivo para nuevos usuarios
- [ ] Animaciones de transición entre pisos
- [ ] Modo oscuro
- [ ] Shortcuts de teclado
- [ ] Undo/Redo para cambios de configuración

---

## 📞 Contacto y Soporte

Para preguntas o reportar bugs:
- Repositorio: `PS2025_TemplaRestaurante`
- Branch actual: `Pedidos-Reservas-feat`

---

## 📄 Licencia

Proyecto desarrollado para Templa Restaurante © 2025

---

**Última actualización**: Noviembre 2025
**Versión**: 1.0.0
