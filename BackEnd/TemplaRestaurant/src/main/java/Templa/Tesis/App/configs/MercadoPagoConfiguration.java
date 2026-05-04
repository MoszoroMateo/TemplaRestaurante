package Templa.Tesis.App.configs;

import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.preference.PreferenceClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MercadoPagoConfiguration {

    @Bean
    public PreferenceClient preferenceClient() {
        return new PreferenceClient();
    }

    @Bean
    public PaymentClient paymentClient() {
        return new PaymentClient();
    }
}
