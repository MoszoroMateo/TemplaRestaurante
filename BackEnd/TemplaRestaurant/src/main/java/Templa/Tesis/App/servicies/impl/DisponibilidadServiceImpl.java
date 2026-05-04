package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.dtos.DisponibilidadDTO;
import Templa.Tesis.App.dtos.PostDisponibilidadDTO;
import Templa.Tesis.App.entities.DisponibilidadEntity;
import Templa.Tesis.App.repositories.DisponibilidadRepository;
import Templa.Tesis.App.servicies.IDisponibilidadService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DisponibilidadServiceImpl implements IDisponibilidadService {

    private final DisponibilidadRepository disponibilidadRepository;
    private final ModelMapper modelMapper;

    @Override
    public DisponibilidadDTO createDisponibilidad(PostDisponibilidadDTO postDisponibilidadDTO) {
        if(postDisponibilidadDTO.getFecha() == null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Debe ingresar las fechas");
        }
        if(postDisponibilidadDTO.getCuposOcupados() < 0){  // ✅ Cambiar == por <
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Los cupos ocupados no pueden ser negativos");
        }
        if(postDisponibilidadDTO.getCuposMaximos() <= 0){  // ✅ Cambiar == por <=
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Debe ingresar la cantidad total de cupos");
        }
        if(postDisponibilidadDTO.getCuposOcupados() > postDisponibilidadDTO.getCuposMaximos()){  // ✅ Validación adicional
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Los cupos ocupados no pueden ser mayores a los cupos máximos");
        }

        try{
            DisponibilidadEntity disponibilidad = modelMapper.map(postDisponibilidadDTO,DisponibilidadEntity.class);
            DisponibilidadEntity disponibilidadGuardada = disponibilidadRepository.save(disponibilidad);
            return modelMapper.map(disponibilidadGuardada,DisponibilidadDTO.class);
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Error al guardar la disponibilidad: " + e.getMessage());
        }
    }


    @Override
    public List<DisponibilidadDTO> getAllDisponibilidades() {
        List<DisponibilidadEntity> disponibilidadEntities = disponibilidadRepository.findAll();
        return disponibilidadEntities.stream()
                .map(entity -> modelMapper.map(entity, DisponibilidadDTO.class))
                .toList();
    }

    @Override
    public DisponibilidadDTO getDisponibilidadById(Integer id) {
        DisponibilidadEntity disponibilidad = disponibilidadRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("La Disponibilidad con ID: " + id + "no se encontro"));
        return modelMapper.map(disponibilidad,DisponibilidadDTO.class);
    }

    @Override
    public DisponibilidadDTO putDisponibilidad(Integer id, PostDisponibilidadDTO postDisponibilidadDTO) {
        DisponibilidadEntity disponibilidad = disponibilidadRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("La Disponibilidad con ID: " + id + "no se encontro"));

        disponibilidad.setFecha(postDisponibilidadDTO.getFecha());
        disponibilidad.setCuposOcupados(postDisponibilidadDTO.getCuposOcupados());
        disponibilidad.setCuposMaximos(postDisponibilidadDTO.getCuposMaximos());
        disponibilidad.setActivo(postDisponibilidadDTO.isActivo());

        DisponibilidadEntity disponibilidadActualizada = disponibilidadRepository.save(disponibilidad);
        return modelMapper.map(disponibilidadActualizada,DisponibilidadDTO.class);
    }
}
