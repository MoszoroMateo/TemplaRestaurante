package Templa.Tesis.App.configs;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.modelmapper.Condition;
import org.modelmapper.Conditions;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MappersConfig {
    @Bean
    public ModelMapper modelMapper() {
        return new ModelMapper();
    }

    @Bean("mergerMapper")
    public ModelMapper mergerMapper() {
        ModelMapper mapper = new ModelMapper();
        Condition<Object, Object> notNullOrEmpty = context -> {
            Object source = context.getSource();
            if(source == null) {
                return false;
            }
            if(source instanceof String) {
                return !((String) source).isEmpty();
            }
            return true;
        };
        mapper.getConfiguration().setPropertyCondition(notNullOrEmpty);
        return mapper;
    }

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        return objectMapper;
    }

}
