# 🧪 Guía para Probar Mercado Pago desde Swagger

## 📋 Pre-requisitos

1. ✅ Backend corriendo en `http://localhost:8081`
2. ✅ Swagger UI disponible en `http://localhost:8081/swagger-ui/index.html`
3. ✅ Credenciales de Mercado Pago configuradas en `application.properties`

## 🔐 Paso 1: Autenticarse en Swagger

Para probar endpoints protegidos necesitas obtener un token JWT:

1. Abre Swagger: `http://localhost:8081/swagger-ui/index.html`
2. Busca el endpoint `POST /api/auth/login`
3. Haz clic en "Try it out"
4. Usa estas credenciales de administrador:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

5. Ejecuta y **copia el token** de la respuesta
6. Haz clic en el botón **"Authorize"** (🔓) en la parte superior derecha
7. Pega el token en el campo `Value` y haz clic en "Authorize"

## 🧪 Paso 2: Crear una Reserva VIP con Mercado Pago

### Endpoint: `POST /api/reserva/crear-vip`

Este endpoint crea una reserva VIP y genera el link de pago de Mercado Pago.

### 💡 Primero obtén IDs válidos:

Antes de crear la reserva VIP, consulta:
- `GET /api/persona/listar` → para obtener un `idPersona` válido
- `GET /api/mesa/listar` → para obtener un `idMesa` válido  
- `GET /api/disponibilidad/listar` → para obtener un `idDisponibilidad` válido

### Ejemplo de Request:

```json
{
  "reservaData": {
    "idPersona": 1,
    "idMesa": 1,
    "idDisponibilidad": 1,
    "nroReserva": 1001,
    "cantidadComensales": 4,
    "fechaReserva": "2025-11-16",
    "evento": "VIP",
    "horario": "20:00",
    "nombreCliente": "Juan Pérez",
    "telefonoCliente": "1234567890",
    "ocasionEspecial": "Cumpleaños"
  },
  "emailCliente": "test@test.com",
  "nombreCliente": "Juan Pérez"
}
```

**⚠️ Importante - Detalles de cada campo**: 
- **`idPersona`**: ID de la persona que hace la reserva (debe existir en la BD)
- **`idMesa`**: ID de la mesa (debe existir en la BD)
- **`idDisponibilidad`**: ID de disponibilidad (debe existir en la BD)
- **`nroReserva`**: Número único de reserva (ejemplo: 1001, 1002, etc.)
- **`cantidadComensales`**: Número de personas
- **`fechaReserva`**: Formato `YYYY-MM-DD` - **DEBE COINCIDIR con la fecha de la disponibilidad seleccionada**
- **`evento`**: Debe ser exactamente `"VIP"` (en mayúsculas) para activar el pago
- **`horario`**: Formato `HH:mm` (ejemplo: "20:00")
- **`emailCliente`**: Cualquier email válido (ejemplo: "test@test.com") - usado solo para notificaciones

### ✅ Respuesta Esperada:

```json
{
  "reservaId": 5,
  "preferenceId": "2991764600-abcd1234-efgh-5678-ijkl-9012mnop3456",
  "initPoint": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "sandboxInitPoint": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "requierePago": true,
  "monto": 5000.0
}
```

### 🔍 Qué significa cada campo:

- **reservaId**: ID de la reserva creada en la base de datos
- **preferenceId**: ID único de la preferencia de pago en Mercado Pago
- **initPoint**: Link de pago para PRODUCCIÓN (no usar aún)
- **sandboxInitPoint**: Link de pago para PRUEBAS ⭐ **USA ESTE**
- **requierePago**: Indica si la reserva requiere pago (true para VIP)
- **monto**: Precio de la reserva VIP (configurado en `application.properties`)

## 🌐 Paso 3: Simular el Pago en Mercado Pago

1. **Copia el `sandboxInitPoint`** de la respuesta
2. **Pégalo en el navegador** para abrir el checkout de Mercado Pago
3. Usa una **tarjeta de prueba** de Mercado Pago:

### 💳 Tarjetas de Prueba (Argentina)

| Escenario | Tarjeta | CVV | Fecha | Nombre |
|-----------|---------|-----|-------|--------|
| ✅ **Pago Aprobado** | `5031 7557 3453 0604` | 123 | 11/25 | APRO |
**✅ Solución:** Usa **SOLO** las tarjetas de prueba **oficiales** de Mercado Pago Argentina (de la documentación oficial):
**Datos del titular:**
#### 🇦🇷 Tarjetas de Prueba Oficiales para Argentina

| Tarjeta | Número | CVV | Fecha | Nombre | Escenario |
|---------|--------|-----|-------|--------|-----------|
| **Mastercard** | `5031 7557 3453 0604` | 123 | 11/30 | APRO | ✅ Pago Aprobado |
| **Visa** | `4509 9535 6623 3704` | 123 | 11/30 | APRO | ✅ Pago Aprobado |
| **American Express** | `3711 803032 57522` | 1234 | 11/30 | APRO | ✅ Pago Aprobado |
| **Mastercard Débito** | `5287 3383 1025 3304` | 123 | 11/30 | APRO | ✅ Pago Aprobado |
| **Visa Débito** | `4002 7686 9439 5619` | 123 | 11/30 | APRO | ✅ Pago Aprobado |
| **Mastercard** | `5031 4332 1540 6351` | 123 | 11/30 | OTHE | ❌ Pago Rechazado |
| **Visa** | `4774 0614 7489 8229` | 123 | 11/30 | OTHE | ❌ Pago Rechazado |
| **Mastercard** | `5031 4368 0252 8031` | 123 | 11/30 | CONT | ⏳ Pago Pendiente |
3. La reserva se actualizará a estado **CONFIRMADA**

- Nombre: APRO (o OTHE/CONT según el escenario que quieras probar)

Revisa la consola del backend, deberías ver:

```
INFO  - Webhook recibido: {type=payment, data={id=123456789}}
INFO  - Pago de reserva recibido - Payment ID: 123456789, Estado: approved
INFO  - Reserva 5 confirmada - Pago aprobado
3. **IMPORTANTE:** La fecha de vencimiento debe ser `11/30` (no `11/25` como dije antes)
4. Si obtienes un error, verifica que no haya **bloqueadores de anuncios** activos

#### ❌ Si Sigues Teniendo Errores 404 con las Tarjetas Oficiales

Si incluso con las tarjetas de la tabla oficial obtienes errores como:

### Endpoint: `GET /api/mercadopago/estado-pago/{paymentId}`

**¿Cómo obtener el paymentId?**
**Posibles causas:**
1. **Bloqueador de anuncios:** AdBlock, uBlock Origin u otras extensiones están bloqueando las peticiones
   - **Solución:** Desactiva temporalmente el bloqueador o agrega una excepción para `*.mercadopago.com`
   ```
2. **Navegador con configuraciones estrictas:** Brave, Firefox con protección estricta
   - **Solución:** Usa Chrome o Edge en modo incógnito

3. **Problemas temporales del sandbox de Mercado Pago**
   - **Solución:** Usa el endpoint de simulación que creamos: `POST /api/mercadopago/simular-pago-aprobado/{reservaId}`
   ```
   GET /api/mercadopago/estado-pago/123456789
   ```

### ✅ Respuesta:

```json
{
  "estado": "approved"
}
```

**Posibles estados:**
- `approved` ✅ - Pago aprobado
- `pending` ⏳ - Pago pendiente
- `rejected` ❌ - Pago rechazado
- `cancelled` 🚫 - Pago cancelado

## 🧪 Paso 6: Verificar la Reserva

### Endpoint: `GET /api/reserva/verificar-pago/{reservaId}`

Usa el `reservaId` que obtuviste en el Paso 2, o busca la reserva en:

### Endpoint: `GET /api/reserva/listar`

Deberías ver la reserva con:
- `pagoCompletado: true`
- `estadoReserva: "CONFIRMADA"`
- `mercadoPagoPaymentId: "123456789"`
- `mercadoPagoPreferenceId: "xxx-xxx-xxx"`

## 📊 Resumen del Flujo Completo

```
1. Autenticarse en Swagger
   ↓
2. POST /api/reserva/crear-vip
   ↓
3. Copiar sandboxInitPoint
   ↓
4. Abrir link en navegador
   ↓
5. Completar pago con tarjeta de prueba (5031 7557 3453 0604)
   ↓
6. Mercado Pago redirige (si webhook configurado, se procesa automáticamente)
   ↓
7. Verificar con GET /api/reserva/verificar-pago/{reservaId}
```

## 🐛 Troubleshooting

### Error 401 Unauthorized
- ✅ Verifica que hayas hecho clic en "Authorize" con el token JWT

### Error 403 Forbidden
- ✅ Tu usuario debe tener rol ADMINISTRADOR
- ✅ Verifica que el token no haya expirado

### Error 404 "Persona no encontrada"
- ✅ Verifica que exista una persona con el `idPersona` proporcionado
- ✅ Usa `GET /api/persona/listar` para ver IDs válidos

### Error 404 "Mesa no encontrada"
- ✅ Verifica que exista una mesa con el `idMesa` proporcionado
- ✅ Usa `GET /api/mesa/listar` para ver IDs válidos

### Error 404 "Disponibilidad no encontrada"
- ✅ Verifica que exista disponibilidad con el `idDisponibilidad` proporcionado
- ✅ Usa `GET /api/disponibilidad/listar` para ver IDs válidos

### Error 409 "La Reserva ya existe"
- ✅ El `nroReserva` debe ser único
- ✅ Usa un número diferente (ejemplo: 1002, 1003, etc.)

### Error 400 "No hay cupos disponibles"
- ✅ La disponibilidad seleccionada no tiene cupos suficientes
- ✅ Selecciona otra fecha/horario con disponibilidad

### El pago no se refleja en la base de datos
- ✅ Si estás en localhost, el webhook NO funcionará
- ✅ Usa el endpoint manual: `GET /api/mercadopago/estado-pago/{paymentId}`
- ✅ O configura ngrok para recibir webhooks

### No puedo abrir el checkout de Mercado Pago
- ✅ Verifica que las credenciales en `application.properties` sean correctas
- ✅ Usa `sandboxInitPoint`, NO `initPoint`
- ✅ Verifica que tu Access Token sea de prueba (TEST)

### Error al parsear JSON
- ✅ Verifica que el formato de `fechaReserva` sea `"YYYY-MM-DD"`
- ✅ Verifica que el formato de `horario` sea `"HH:mm"`
- ✅ Verifica que `evento` sea exactamente `"VIP"` (mayúsculas)

## 📝 Notas Importantes

1. **Modo Sandbox**: Estás usando credenciales de prueba, por eso usas `sandboxInitPoint`
2. **Webhook en localhost**: No funcionará directamente, necesitas ngrok o verificar manualmente
3. **Tarjetas de prueba**: Solo funcionan en sandbox, NO uses tarjetas reales
4. **Precio de reserva**: Configurado en `application.properties` con `reserva.vip.precio`
5. **Estado PENDIENTE_PAGO**: La reserva se crea primero en este estado, cambia a CONFIRMADA al aprobar el pago

## 🎯 Próximos Pasos

Una vez que confirmes que el backend funciona:

1. ✅ Implementar el frontend para consumir estos endpoints
2. ✅ Configurar ngrok para recibir webhooks en desarrollo
3. ✅ Configurar un dominio real para producción
4. ✅ Cambiar a credenciales de producción de Mercado Pago
5. ✅ Implementar notificaciones al usuario sobre el estado del pago

## 🔗 Recursos Útiles

- [Documentación de Mercado Pago](https://www.mercadopago.com.ar/developers)
- [Tarjetas de prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards)
- [Simulador de webhooks](https://www.mercadopago.com.ar/developers/panel/app)
- [Ngrok - Para exponer localhost](https://ngrok.com/)

## 📞 Ejemplo Completo de Prueba

### 1. Login:
```json
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}
```

### 2. Crear Reserva VIP:
```json
POST /api/reserva/crear-vip
{
  "reservaData": {
    "idPersona": 1,
    "idMesa": 1,
    "idDisponibilidad": 1,
    "nroReserva": 1001,
    "cantidadComensales": 4,
    "fechaReserva": "2025-11-16",
    "evento": "VIP",
    "horario": "20:00",
    "nombreCliente": "Juan Pérez",
    "telefonoCliente": "1234567890",
    "ocasionEspecial": "Cumpleaños"
  },
  "emailCliente": "test@test.com",
  "nombreCliente": "Juan Pérez"
}
```

### 3. Verificar Estado (después del pago):
```
GET /api/mercadopago/estado-pago/123456789
```

### 4. Ver Reserva:
```
GET /api/reserva/verificar-pago/5
```

¡Listo! 🎉 Ahora puedes probar la integración completa de Mercado Pago desde Swagger.
