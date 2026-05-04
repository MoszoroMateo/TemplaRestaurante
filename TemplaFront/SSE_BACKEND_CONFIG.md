# Configuración Backend para SSE (Server-Sent Events)

## ⚠️ Estado Actual
El SSE está **temporalmente deshabilitado** en el frontend porque el backend devuelve **403 Forbidden**.

## 🔧 Configuración Necesaria en el Backend

### 1. Configuración de Spring Security

El endpoint SSE necesita permitir autenticación via query parameter `?token=`. 

Agregar en la clase de configuración de seguridad:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/sse/**").permitAll() // Permitir SSE (manejaremos auth manualmente)
                .anyRequest().authenticated()
            )
            .addFilterBefore(new SseTokenAuthenticationFilter(), 
                            UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
```

### 2. Filtro Custom para Autenticación SSE

Crear `SseTokenAuthenticationFilter.java`:

```java
@Component
public class SseTokenAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                   HttpServletResponse response, 
                                   FilterChain filterChain) 
            throws ServletException, IOException {
        
        String requestURI = request.getRequestURI();
        
        // Solo aplicar a endpoints SSE
        if (requestURI.startsWith("/api/sse/")) {
            String token = request.getParameter("token");
            
            if (token != null && jwtService.validateToken(token)) {
                String username = jwtService.getUsernameFromToken(token);
                
                // Crear autenticación
                UsernamePasswordAuthenticationToken authentication = 
                    new UsernamePasswordAuthenticationToken(username, null, 
                        jwtService.getAuthoritiesFromToken(token));
                
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }
        
        filterChain.doFilter(request, response);
    }
}
```

### 3. Controlador SSE

Crear `SseController.java`:

```java
@RestController
@RequestMapping("/api/sse")
@CrossOrigin(origins = "http://localhost:4200")
public class SseController {

    @Autowired
    private SseEmitterService sseEmitterService;

    @GetMapping(path = "/cocina", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter conectarCocina(@RequestParam String token) {
        // Token ya validado por el filtro
        return sseEmitterService.crearEmitter();
    }
}
```

### 4. Servicio de Gestión de Emitters

Crear `SseEmitterService.java`:

```java
@Service
public class SseEmitterService {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter crearEmitter() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError((ex) -> emitters.remove(emitter));
        
        emitters.add(emitter);
        return emitter;
    }

    public void enviarEvento(String eventName, Object data) {
        List<SseEmitter> deadEmitters = new ArrayList<>();
        
        emitters.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event()
                    .name(eventName)
                    .data(data));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        });
        
        emitters.removeAll(deadEmitters);
    }

    public void enviarNuevoPedido(GetPedidoDto pedido) {
        enviarEvento("nuevo-pedido", pedido);
    }

    public void enviarPedidoActualizado(GetPedidoDto pedido) {
        enviarEvento("pedido-actualizado", pedido);
    }

    public void enviarEstadoCocina(Map<String, Object> estado) {
        enviarEvento("estado-cocina", estado);
    }
}
```

### 5. Integrar Eventos en los Servicios

Modificar `PedidoService.java` para emitir eventos:

```java
@Service
public class PedidoService {

    @Autowired
    private SseEmitterService sseEmitterService;

    public GetPedidoDto crearPedido(CreatePedidoDto dto) {
        // ... lógica existente ...
        
        GetPedidoDto pedidoCreado = // ... resultado
        
        // Emitir evento SSE
        sseEmitterService.enviarNuevoPedido(pedidoCreado);
        
        return pedidoCreado;
    }

    public GetPedidoDto actualizarEstado(Long id, EstadoPedido estado) {
        // ... lógica existente ...
        
        GetPedidoDto pedidoActualizado = // ... resultado
        
        // Emitir evento SSE
        sseEmitterService.enviarPedidoActualizado(pedidoActualizado);
        
        return pedidoActualizado;
    }
}
```

## ✅ Habilitar SSE en Frontend

Una vez configurado el backend, descomentar en el frontend:

### 1. En `cocina.service.ts`:
```typescript
constructor(
  private http: HttpClient,
  private authService: AuthService,
  private pedidoService: PedidoService
) {
  this.iniciarConexionTiempoReal(); // ← Descomentar esta línea
}
```

### 2. En `mapa-mesas.component.ts`:
```typescript
ngOnInit(): void {
  this.verificarPermisos();
  this.cargarMesasDisponibles();
  this.cargarMesasEnPlano();
  this.suscribirseAEventosSSE(); // ← Descomentar esta línea
}
```

## 🧪 Pruebas

1. Abrir dos navegadores/tabs con la aplicación
2. Crear un pedido en uno
3. Verificar que el otro se actualice automáticamente
4. Revisar consola del navegador para logs SSE:
   - "✅ Conexión SSE establecida para cocina"
   - "🆕 Nuevo pedido recibido via SSE"
   - "🔄 Pedido actualizado via SSE"

## 📚 Referencias

- [Spring SSE Documentation](https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#mvc-ann-async-sse)
- [EventSource API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [Spring Security Custom Filters](https://docs.spring.io/spring-security/reference/servlet/architecture.html#servlet-security-filters)
