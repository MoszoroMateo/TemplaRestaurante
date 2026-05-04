# 🚀 Guía para Pasar a Producción con Mercado Pago

## ⚠️ IMPORTANTE: Diferencias entre Sandbox y Producción

### 🧪 Modo Sandbox (ACTUAL - Solo Pruebas)

**Características:**
- ✅ No procesa dinero real
- ✅ Usa tarjetas de prueba simuladas
- ✅ No requiere verificación de cuenta
- ✅ Ideal para desarrollo y testing
- ❌ **NO acepta cuentas reales de Mercado Pago**
- ❌ **NO procesa pagos reales**

**Credenciales actuales en tu proyecto:**
```properties
mercadopago.access.token=APP_USR-2347801072195203-111421-... (SANDBOX)
mercadopago.public.key=APP_USR-f86f1af9-b084-42e5-bd21-... (SANDBOX)
```

### 💰 Modo Producción (Pagos Reales)

**Características:**
- ✅ Procesa dinero real
- ✅ Acepta todas las formas de pago (tarjetas, efectivo, Mercado Pago, etc.)
- ✅ Los clientes pagan y tú recibes el dinero
- ⚠️ Requiere cuenta verificada de Mercado Pago
- ⚠️ Mercado Pago cobra comisiones por transacción

---

## 📋 Checklist Antes de Ir a Producción

Antes de activar pagos reales, asegúrate de tener:

- [ ] Cuenta de Mercado Pago **verificada** (con DNI, domicilio, datos bancarios)
- [ ] Aplicación creada en el panel de desarrolladores de Mercado Pago
- [ ] Credenciales de **producción** obtenidas
- [ ] Dominio real o servidor público (no `localhost`)
- [ ] Certificado SSL/HTTPS configurado
- [ ] Política de privacidad y términos de servicio publicados
- [ ] Sistema de notificaciones al cliente implementado

---

## 🔧 Paso 1: Obtener Credenciales de Producción

### 1.1 Verificar tu Cuenta de Mercado Pago

Antes que nada, tu cuenta debe estar **verificada**:

1. Ingresa a: https://www.mercadopago.com.ar/
2. Ve a **"Tu perfil" → "Seguridad"**
3. Completa la verificación de identidad (DNI, selfie, etc.)
4. Agrega tus datos bancarios para recibir el dinero

### 1.2 Crear una Aplicación

1. Ve a: https://www.mercadopago.com.ar/developers/panel/app
2. Haz clic en **"Crear aplicación"**
3. Completa los datos:
   - **Nombre:** "Templa Restaurant - Sistema de Reservas"
   - **Descripción:** "Sistema de gestión de reservas VIP"
   - **Integración:** Checkout Pro
4. Guarda la aplicación

### 1.3 Obtener las Credenciales de Producción

1. En el panel de tu aplicación, ve a **"Credenciales"**
2. Selecciona la pestaña **"Credenciales de producción"**
3. **⚠️ IMPORTANTE:** Necesitarás activar el modo producción primero
4. Copia:
   - **Access Token** (empieza con `APP_USR-` seguido de números)
   - **Public Key** (empieza con `APP_USR-` seguido de un UUID)

**🔒 Guarda estas credenciales de forma segura - NO las compartas públicamente**

---

## 🔧 Paso 2: Actualizar el Backend

### 2.1 Configurar Variables de Entorno (RECOMENDADO)

**⚠️ NO pongas las credenciales de producción directamente en `application.properties`**

En lugar de eso, usa **variables de entorno**:

#### Opción A: Variables de Entorno del Sistema

**Windows (CMD):**
```cmd
set MERCADOPAGO_ACCESS_TOKEN=TU_ACCESS_TOKEN_DE_PRODUCCION
set MERCADOPAGO_PUBLIC_KEY=TU_PUBLIC_KEY_DE_PRODUCCION
```

**Windows (PowerShell):**
```powershell
$env:MERCADOPAGO_ACCESS_TOKEN="TU_ACCESS_TOKEN_DE_PRODUCCION"
$env:MERCADOPAGO_PUBLIC_KEY="TU_PUBLIC_KEY_DE_PRODUCCION"
```

**Linux/Mac:**
```bash
export MERCADOPAGO_ACCESS_TOKEN=TU_ACCESS_TOKEN_DE_PRODUCCION
export MERCADOPAGO_PUBLIC_KEY=TU_PUBLIC_KEY_DE_PRODUCCION
```

#### Opción B: Archivo `.env` (con Spring Boot)

Crea un archivo `.env` en la raíz del proyecto:

```env
MERCADOPAGO_ACCESS_TOKEN=TU_ACCESS_TOKEN_DE_PRODUCCION
MERCADOPAGO_PUBLIC_KEY=TU_PUBLIC_KEY_DE_PRODUCCION
```

**⚠️ IMPORTANTE:** Agrega `.env` a tu `.gitignore` para no subirlo a GitHub.

### 2.2 Actualizar `application.properties`

Modifica tu archivo para usar variables de entorno:

```properties
# Configuración de MercadoPago (Producción)
mercadopago.access.token=${MERCADOPAGO_ACCESS_TOKEN:APP_USR-sandbox-fallback}
mercadopago.public.key=${MERCADOPAGO_PUBLIC_KEY:APP_USR-sandbox-fallback}

# URLs de producción
app.frontend.url=${FRONTEND_URL:https://tu-dominio.com}
app.backend.url=${BACKEND_URL:https://api.tu-dominio.com}
```

### 2.3 Actualizar URLs en el Código

Modifica `MercadoPagoServiceImpl.java` para usar URLs dinámicas:

**Antes (hardcoded localhost):**
```java
PreferenceBackUrlsRequest backUrls = PreferenceBackUrlsRequest.builder()
    .success("http://localhost:4200/reservas/success")
    .failure("http://localhost:4200/reservas/failure")
    .pending("http://localhost:4200/reservas/pending")
    .build();
```

**Después (URLs configurables):**
```java
@Value("${app.frontend.url}")
private String frontendUrl;

@Value("${app.backend.url}")
private String backendUrl;

// Dentro del método crearPreferenciaReservaVip:
PreferenceBackUrlsRequest backUrls = PreferenceBackUrlsRequest.builder()
    .success(frontendUrl + "/reservas/success")
    .failure(frontendUrl + "/reservas/failure")
    .pending(frontendUrl + "/reservas/pending")
    .build();

// ...

.notificationUrl(backendUrl + "/api/mercadopago/webhook")
```

---

## 🔧 Paso 3: Configurar Webhooks

Los webhooks son **ESENCIALES** para que Mercado Pago notifique cuando un pago es aprobado.

### 3.1 Opción A - Desarrollo: Usar ngrok

Para probar webhooks en desarrollo:

1. **Instala ngrok:** https://ngrok.com/download
2. **Ejecuta tu backend:** Puerto 8081
3. **Expón el puerto:**
   ```bash
   ngrok http 8081
   ```
4. **Copia la URL generada:** Ejemplo: `https://abc123.ngrok.io`
5. **Actualiza el código:**
   ```java
   .notificationUrl("https://abc123.ngrok.io/api/mercadopago/webhook")
   ```

### 3.2 Opción B - Producción: Dominio Real

1. **Despliega tu backend** en un servidor (Heroku, AWS, Azure, etc.)
2. **Configura HTTPS** (obligatorio para webhooks)
3. **Usa tu dominio:**
   ```java
   .notificationUrl("https://api.tu-dominio.com/api/mercadopago/webhook")
   ```

### 3.3 Configurar la URL del Webhook en Mercado Pago

1. Ve al panel de tu aplicación en Mercado Pago
2. **"Webhooks" → "Configurar notificaciones"**
3. Agrega la URL: `https://tu-dominio.com/api/mercadopago/webhook`
4. Selecciona eventos: **"Pagos"**
5. Guarda

---

## 🔧 Paso 4: Actualizar el Frontend

### 4.1 Cambiar de `sandboxInitPoint` a `initPoint`

**Antes (sandbox):**
```typescript
window.location.href = response.sandboxInitPoint;
```

**Después (producción):**
```typescript
window.location.href = response.initPoint;
```

### 4.2 Actualizar URLs de API

Cambia las URLs del backend:

**Antes (desarrollo):**
```typescript
const API_URL = 'http://localhost:8081/api';
```

**Después (producción):**
```typescript
const API_URL = 'https://api.tu-dominio.com/api';
```

---

## 🔧 Paso 5: Eliminar Endpoints de Testing

**⚠️ IMPORTANTE:** Antes de ir a producción, **ELIMINA** el endpoint de simulación de pago:

### Eliminar de `MercadoPagoController.java`:

```java
// ELIMINAR ESTE MÉTODO COMPLETO:
@PostMapping("/simular-pago-aprobado/{reservaId}")
public ResponseEntity<Map<String, String>> simularPagoAprobado(@PathVariable Integer reservaId) {
    // ... TODO ESTE CÓDIGO
}
```

### Eliminar de `IMercadoPagoService.java`:

```java
// ELIMINAR ESTA LÍNEA:
void simularPagoAprobadoPorReserva(Integer reservaId, String fakePaymentId);
```

### Eliminar de `MercadoPagoServiceImpl.java`:

```java
// ELIMINAR ESTE MÉTODO COMPLETO:
@Override
@Transactional
public void simularPagoAprobadoPorReserva(Integer reservaId, String fakePaymentId) {
    // ... TODO ESTE CÓDIGO
}
```

**Razón:** Este endpoint permitiría a cualquiera confirmar reservas sin pagar realmente.

---

## 🔧 Paso 6: Configurar Seguridad Adicional

### 6.1 Validar Firma de Webhooks (Opcional pero Recomendado)

Mercado Pago envía una firma `x-signature` en los headers del webhook para validar que la petición es legítima:

```java
@PostMapping("/webhook")
public ResponseEntity<Void> webhookReserva(
        @RequestBody Map<String, Object> payload,
        @RequestHeader(value = "x-signature", required = false) String signature,
        @RequestHeader(value = "x-request-id", required = false) String requestId) {
    
    // Validar firma (implementación depende de la versión del SDK)
    // Ver: https://www.mercadopago.com.ar/developers/es/docs/checkout-api/additional-content/security/signature
    
    // ... resto del código
}
```

### 6.2 Limitar Intentos de Pago

Implementa un límite de intentos fallidos para evitar fraude:

```java
if (reserva.getIntentosPagoFallidos() > 3) {
    throw new RuntimeException("Demasiados intentos fallidos");
}
```

---

## 💰 Comisiones de Mercado Pago

Cuando uses producción, Mercado Pago cobrará comisiones:

### Tarifas (Argentina - 2025)

| Método de Pago | Comisión |
|----------------|----------|
| Tarjeta de crédito | 6.57% + IVA |
| Tarjeta de débito | 4.59% + IVA |
| Dinero en cuenta MP | 6.57% + IVA |
| Efectivo (Rapipago/PagoFácil) | 3.99% + IVA |

**Ejemplo:** 
- Precio reserva VIP: $5,000
- Comisión MP (tarjeta crédito): ~$428 (6.57% + IVA)
- **Tú recibes:** ~$4,572

**💡 Tip:** Puedes configurar que el cliente pague la comisión o incluirla en tu precio.

---

## 🧪 Testing en Producción

Antes de lanzar al público:

### 1. Probar con Cuenta de Prueba Real

1. Crea una cuenta de Mercado Pago de prueba (con email diferente)
2. Agrega una tarjeta real a esa cuenta
3. Haz una reserva VIP de prueba
4. **⚠️ IMPORTANTE:** Cancela el pago después para recuperar el dinero

### 2. Verificar el Flujo Completo

- [ ] Crear reserva VIP
- [ ] Abrir checkout de Mercado Pago
- [ ] Completar pago con tarjeta real
- [ ] Verificar que el webhook se recibe
- [ ] Verificar que la reserva cambia a CONFIRMADA
- [ ] Verificar que los cupos se actualizan
- [ ] Verificar que el dinero llega a tu cuenta MP

---

## 📊 Monitoreo en Producción

### Logs Importantes a Monitorear

```java
// En MercadoPagoServiceImpl.java
log.info("Preferencia creada: {} - Monto: {}", preferenceId, PRECIO_RESERVA_VIP);
log.info("Webhook recibido - Payment ID: {}", paymentId);
log.info("Pago aprobado - Reserva: {} - Monto: {}", nroReserva, payment.getTransactionAmount());
log.error("Error al procesar pago: {}", e.getMessage());
```

### Dashboard de Mercado Pago

Monitorea tus pagos en:
- https://www.mercadopago.com.ar/movements

Aquí verás:
- Pagos recibidos
- Comisiones cobradas
- Dinero disponible para retirar

---

## 🚨 Troubleshooting en Producción

### Error 401 - Invalid Credentials

**Causa:** Credenciales incorrectas o de sandbox en producción

**Solución:**
- Verifica que estés usando credenciales de **producción**, no sandbox
- Verifica que el Access Token esté bien copiado (sin espacios)

### Webhook No se Recibe

**Causa:** URL no accesible públicamente

**Solución:**
- Verifica que tu backend tenga HTTPS
- Verifica que la URL sea accesible desde internet (no `localhost`)
- Prueba acceder a la URL del webhook desde otro dispositivo

### Pago Aprobado pero Reserva No se Confirma

**Causa:** Webhook no procesado correctamente

**Solución:**
- Revisa los logs del backend
- Verifica que el `externalReference` sea correcto
- Verifica que el `nroReserva` exista en la base de datos

---

## 📝 Checklist Final Antes de Lanzar

- [ ] Credenciales de producción configuradas
- [ ] Variables de entorno configuradas (no hardcoded)
- [ ] URLs de frontend y backend actualizadas
- [ ] HTTPS configurado en el backend
- [ ] Webhooks configurados y funcionando
- [ ] Endpoint de simulación de pago **ELIMINADO**
- [ ] Prueba completa con pago real realizada
- [ ] Política de privacidad y términos de servicio publicados
- [ ] Sistema de notificaciones al cliente funcionando
- [ ] Monitoreo de logs configurado
- [ ] Plan de respaldo si algo falla

---

## 🎯 Resumen

### Modo Sandbox (ACTUAL)
✅ Ideal para desarrollo  
✅ No procesa dinero real  
✅ Usa tarjetas de prueba  
❌ No acepta cuentas reales  

### Modo Producción (FUTURO)
✅ Procesa dinero real  
✅ Acepta todas las formas de pago  
⚠️ Requiere dominio real y HTTPS  
⚠️ Mercado Pago cobra comisiones  

---

## 🔗 Recursos Útiles

- [Panel de Mercado Pago](https://www.mercadopago.com.ar/developers/panel/app)
- [Documentación de Producción](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing)
- [Validación de Webhooks](https://www.mercadopago.com.ar/developers/es/docs/checkout-api/additional-content/security/signature)
- [Tarifas y Comisiones](https://www.mercadopago.com.ar/ayuda/costos-recibir-pagos_220)

---

## ⚠️ ADVERTENCIA FINAL

**NO uses credenciales de producción en desarrollo.**  
**NO subas credenciales de producción a GitHub.**  
**NO elimines validaciones de seguridad.**  
**SÍ mantén logs detallados de todos los pagos.**  
**SÍ implementa un sistema de respaldo/reversión de pagos.**

---

¡Listo! Con esta guía podrás pasar de desarrollo a producción de forma segura cuando estés listo. 🚀

