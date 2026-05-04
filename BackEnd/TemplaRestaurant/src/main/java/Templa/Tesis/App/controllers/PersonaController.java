package Templa.Tesis.App.controllers;

import Templa.Tesis.App.dtos.GetPersonasFiltroDto;
import Templa.Tesis.App.dtos.PersonaDto;
import Templa.Tesis.App.dtos.PostPersonaDto;
import Templa.Tesis.App.servicies.IPersonaService;
import Templa.Tesis.App.servicies.impl.PersonaServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;

@RestController
@RequestMapping("/api/persona")
@RequiredArgsConstructor
public class PersonaController {

    private final IPersonaService personaService;

    @GetMapping("/personas")
    public Page<PersonaDto> getPersonas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return personaService.traerPersonas(page, size);
    }

    @GetMapping("/personas/sin-usuario")
    public Page<PersonaDto> getPersonalSinUsuario(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "1000") int size
    ) {
        return personaService.traerPersonalSinUsuario(page, size);
    }

    @GetMapping("/personas/filtrar")
    public Page<PersonaDto> getPersonasFiltradas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String buscarFiltro,
            @RequestParam(required = false) String tipoPersona,
            @RequestParam(required = false) String estado
    ) {
        // Validación manual para tipoPersona y estado
        if (tipoPersona != null && !tipoPersona.isEmpty() && !tipoPersona.matches("^(PERSONAL|CLIENTE)$")) {
            throw new IllegalArgumentException("tipoPersona debe ser 'PERSONAL' o 'CLIENTE'");
        }
        if (estado != null && !estado.isEmpty() && !estado.matches("^(ACTIVOS|BAJA|TODOS)$")) {
            throw new IllegalArgumentException("estado debe ser 'ACTIVOS', 'BAJA' o 'TODOS'");
        }
        return personaService.traerPersonas(page, size, buscarFiltro, tipoPersona, estado);
    }

    @GetMapping("/personas/dni/{dni}")
    public ResponseEntity<PersonaDto> getPersonaPorDni(@PathVariable Integer dni) {
        PersonaDto persona = personaService.buscarPorDni(dni);
        if (persona == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(persona);
    }


    @PostMapping("/crear")
    public ResponseEntity<PersonaDto> crearPersona( @RequestBody PostPersonaDto nuevaPersona) {
        return ResponseEntity.ok(personaService.insertarPersona(nuevaPersona));
    }
    
    @PutMapping("/actualizar")
    public ResponseEntity<PersonaDto> actualizarPersona(@RequestBody PersonaDto nuevaPersona) {
        return ResponseEntity.ok(personaService.actualizarPersona(nuevaPersona));
    }

    @DeleteMapping("/baja/{id}")
    public ResponseEntity<Void> bajaPersona(@PathVariable Integer id) {
        try{
            personaService.bajaPersona(id);
            return ResponseEntity.ok().build();
        } catch (Exception e){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al dar de baja la Persona");
        }
    }


}
