package Templa.Tesis.App.servicies;

import Templa.Tesis.App.dtos.PersonaDto;
import Templa.Tesis.App.dtos.PostPersonaDto;
import org.springframework.data.domain.Page;

public interface IPersonaService {
    Page<PersonaDto> traerPersonas(int page, int size);
    Page<PersonaDto> traerPersonas(int page, int size, String buscarFiltro, String tipoPersonaFiltro, String estado);
    Page<PersonaDto> traerPersonalSinUsuario(int page, int size);
    PersonaDto insertarPersona(PostPersonaDto nuevaPersona);
    PersonaDto actualizarPersona(PersonaDto personaActualizada);
    void bajaPersona(Integer id);
    PersonaDto buscarPorDni(Integer dni);
}
