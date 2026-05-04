# Integración SSE en Backend - Paso 2

## ✅ Ya Implementado
- ✅ `SseAuthenticationFilter.java` - Autenticación por query param
- ✅ `SseController.java` - Endpoints SSE
- ✅ `SecurityConfig.java` - Configuración de seguridad

## 🔧 Falta: Emitir Eventos desde los Servicios

### Modificar `PedidoService.java`

Inyectar el `SseController` y emitir eventos cuando se creen o actualicen pedidos:

```java
@Service
public class PedidoService {

    @Autowired
    private SseController sseController;  // ← AGREGAR ESTO

    @Autowired
    private PedidoRepository pedidoRepository;
    
    // ... otros @Autowired

    /**
     * Crear un nuevo pedido
     */
    public GetPedidoDto crearPedido(CreatePedidoDto dto) {
        // ... lógica existente para crear pedido ...
        
        Pedido pedido = pedidoRepository.save(nuevoPedido);
        GetPedidoDto resultado = mapearADto(pedido);
        
        // ✅ EMITIR EVENTO SSE
        sseController.sendNotification(
            "cocina",           // Tipo de notificación
            "nuevo-pedido",     // Nombre del evento
            resultado           // Datos del pedido
        );
        
        return resultado;
    }

    /**
     * Actualizar estado de pedido
     */
    public GetPedidoDto actualizarEstado(Long idPedido, EstadoPedido nuevoEstado) {
        // ... lógica existente ...
        
        pedido.setEstado(nuevoEstado);
        Pedido pedidoActualizado = pedidoRepository.save(pedido);
        GetPedidoDto resultado = mapearADto(pedidoActualizado);
        
        // ✅ EMITIR EVENTO SSE
        sseController.sendNotification(
            "cocina",              // Tipo de notificación
            "pedido-actualizado",  // Nombre del evento
            resultado              // Datos del pedido
        );
        
        return resultado;
    }

    /**
     * Finalizar pedido
     */
    public GetPedidoDto finalizarPedido(Long idPedido) {
        // ... lógica existente ...
        
        pedido.setEstado(EstadoPedido.FINALIZADO);
        pedido.setFechaFin(LocalDateTime.now());
        Pedido pedidoFinalizado = pedidoRepository.save(pedido);
        GetPedidoDto resultado = mapearADto(pedidoFinalizado);
        
        // ✅ EMITIR EVENTO SSE
        sseController.sendNotification(
            "cocina",
            "pedido-actualizado",
            resultado
        );
        
        return resultado;
    }

    /**
     * Actualizar detalles de pedido (items)
     */
    public GetPedidoDto actualizarPedido(Long idPedido, UpdatePedidoDto dto) {
        // ... lógica existente ...
        
        Pedido pedidoActualizado = pedidoRepository.save(pedido);
        GetPedidoDto resultado = mapearADto(pedidoActualizado);
        
        // ✅ EMITIR EVENTO SSE
        sseController.sendNotification(
            "cocina",
            "pedido-actualizado",
            resultado
        );
        
        return resultado;
    }

    /**
     * Cancelar items del pedido
     */
    public GetPedidoDto cancelarDetalles(Long idPedido, List<Long> idsDetalles) {
        // ... lógica existente ...
        
        GetPedidoDto resultado = mapearADto(pedido);
        
        // ✅ EMITIR EVENTO SSE
        sseController.sendNotification(
            "cocina",
            "pedido-actualizado",
            resultado
        );
        
        return resultado;
    }

    /**
     * Entregar items del pedido
     */
    public GetPedidoDto entregarDetalles(Long idPedido, List<Long> idsDetalles) {
        // ... lógica existente ...
        
        GetPedidoDto resultado = mapearADto(pedido);
        
        // ✅ EMITIR EVENTO SSE
        sseController.sendNotification(
            "cocina",
            "pedido-actualizado",
            resultado
        );
        
        return resultado;
    }
}
```

## 📋 Eventos a Emitir

### 1. **nuevo-pedido**
Se emite cuando:
- `crearPedido()` - Se crea un nuevo pedido

### 2. **pedido-actualizado**
Se emite cuando:
- `actualizarEstado()` - Cambia el estado del pedido
- `finalizarPedido()` - Se finaliza el pedido
- `actualizarPedido()` - Se agregan/modifican items
- `cancelarDetalles()` - Se cancelan items
- `entregarDetalles()` - Se marcan items como entregados

### 3. **estado-cocina** (opcional)
Se puede emitir cuando:
- Se actualicen estadísticas generales
- Se notifiquen alertas de cocina

## 🧪 Probar que Funciona

### 1. Verificar conexión SSE
Abrir la consola del navegador, deberías ver:
```
✅ Conexión SSE establecida para cocina
```

### 2. Crear un pedido
En una pestaña, crear un pedido. En la consola deberías ver:
```
🆕 Nuevo pedido recibido via SSE: {idPedido: 123, ...}
```

### 3. Actualizar un pedido
Modificar el pedido. En la consola:
```
🔄 Pedido actualizado via SSE: {idPedido: 123, ...}
```

### 4. Verificar sincronización multi-dispositivo
1. Abrir 2 pestañas con el mapa de mesas
2. En la pestaña 1: crear un pedido en la mesa 5
3. En la pestaña 2: **automáticamente** debería verse la mesa 5 ocupada
4. ✅ **Sin necesidad de F5**

## 🔍 Debug

Si no funciona, revisar en backend:

```java
// En SseController.sendNotification()
System.out.println("📤 Enviando evento SSE: " + eventName + " a " + emitters.size() + " clientes");
System.out.println("Datos: " + data);
```

Y en frontend, la consola debería mostrar:
```
SSE: Nuevo pedido recibido: {...}
SSE: Pedido actualizado: {...}
```

## ⚠️ Importante

**NO emitir eventos dentro de transacciones no confirmadas**. Asegurarse de que los eventos SSE se emitan **DESPUÉS** de que el `save()` se haya completado exitosamente.

Si hay errores, envolver en try-catch:

```java
try {
    sseController.sendNotification("pedido-actualizado", resultado);
} catch (Exception e) {
    // Log del error pero no fallar el pedido
    log.error("Error enviando notificación SSE", e);
}
```
