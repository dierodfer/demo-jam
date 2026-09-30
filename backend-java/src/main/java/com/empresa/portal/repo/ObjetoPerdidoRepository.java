package com.empresa.portal.repo;

import com.empresa.portal.model.ObjetoPerdido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ObjetoPerdidoRepository extends JpaRepository<ObjetoPerdido, Long> {

    List<ObjetoPerdido> findAllByOrderByIdDesc();
}
