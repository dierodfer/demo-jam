package com.empresa.portal.repo;

import com.empresa.portal.model.ObjetoReclamacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ObjetoReclamacionRepository extends JpaRepository<ObjetoReclamacion, Long> {

    List<ObjetoReclamacion> findByObjetoIdOrderByIdAsc(Long objetoId);

    Optional<ObjetoReclamacion> findByObjetoIdAndReclamanteId(Long objetoId, Long reclamanteId);

    void deleteByObjetoId(Long objetoId);
}
