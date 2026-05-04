package Templa.Tesis.App.servicies.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private final JavaMailSender mailSender;
    @Value("${spring.mail.username}")  // lee tu mail del application.properties
    private String remitente;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void enviarMail(String para, String asunto, String cuerpo) {
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setTo(para);
        mensaje.setSubject(asunto);
        mensaje.setText(cuerpo);
        mensaje.setFrom(remitente);
        mailSender.send(mensaje);
    }

    public void enviarMailNuevoUsuario(String para, String nombreCompleto, String username, String password) {
        String asunto = "Bienvenido a Templa - Tu cuenta ha sido creada";
        String cuerpo = "Hola " + nombreCompleto + ",\n\n" +
                "Nos complace informarte que tu cuenta ha sido creada exitosamente en Templa.\n\n" +
                "A continuación encontrarás tus credenciales de acceso:\n\n" +
                "Usuario: " + username + "\n" +
                "Contraseña: " + password + "\n\n" +
                "Ya podés acceder al sistema y comenzar a utilizar nuestros servicios.\n\n" +
                "Ante cualquier consulta, no dudes en comunicarte con nuestro equipo de soporte.\n\n" +
                "Saludos cordiales,\n" +
                "El equipo de Templa";
        enviarMail(para, asunto, cuerpo);
    }

    public void enviarMailStockBajo(String para,String nombreProducto,double stockActual, double stockMinimo){
        String asunto = "Alerta Stock Bajo - " + nombreProducto;
        String cuerpo = "¡ALERTA DE STOCK BAJO!\n\n" +
                "El producto '" + nombreProducto + "' ha alcanzado un nivel crítico de stock.\n\n" +
                "Detalles:\n" +
                "- Producto: " + nombreProducto + "\n" +
                "- Stock actual: " + stockActual + "\n" +
                "- Stock mínimo: " + stockMinimo + "\n\n" +
                "Es necesario realizar un reabastecimiento urgente para evitar desabastecimiento.\n\n" +
                "Saludos,\n" +
                "Sistema de Gestión Templa";
        enviarMail(para,asunto,cuerpo);
    }

    public void enviarMailConfirmacionReserva(String para, String nombreCliente, Integer nroReserva,
                                              String fechaReserva, String horario, String evento,
                                              Integer cantidadComensales) {
        String asunto = "Confirmación de Reserva - Templa";
        String cuerpo = "Hola " + nombreCliente + ",\n\n" +
                "¡Tu reserva ha sido confirmada exitosamente!\n\n" +
                "Detalles de tu reserva:\n\n" +
                "Número de reserva: " + nroReserva + "\n" +
                "Fecha: " + fechaReserva + "\n" +
                "Horario: " + horario + "\n" +
                "Evento: " + evento + "\n" +
                "Cantidad de comensales: " + cantidadComensales + "\n\n" +
                "Tu mesa estará lista para cuando nos visites.\n\n" +
                "Si necesitas modificar o cancelar tu reserva, por favor contáctanos con al menos 24 horas de anticipación.\n\n" +
                "Te esperamos en Templa para brindarte una experiencia única.\n\n" +
                "Saludos cordiales,\n" +
                "El equipo de Templa\n\n";

        enviarMail(para, asunto, cuerpo);
    }
}
