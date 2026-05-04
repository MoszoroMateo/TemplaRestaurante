package Templa.Tesis.App.servicies;

import Templa.Tesis.App.dtos.DisponibilidadDTO;
import Templa.Tesis.App.dtos.PostDisponibilidadDTO;

import java.util.List;

public interface IDisponibilidadService {
 DisponibilidadDTO createDisponibilidad(PostDisponibilidadDTO postDisponibilidadDTO);
 List<DisponibilidadDTO> getAllDisponibilidades();
 DisponibilidadDTO getDisponibilidadById(Integer id);
 DisponibilidadDTO putDisponibilidad(Integer id,PostDisponibilidadDTO postDisponibilidadDTO);
}
