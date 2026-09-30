package com.empresa.portal.web;

import com.empresa.portal.model.Empleado;
import com.empresa.portal.repo.EmpleadoRepository;
import com.empresa.portal.web.dto.EmpleadoResumenDto;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

/** Directorio mínimo de empleados para elegir destinatario de una entrega. */
@RestController
@RequestMapping("/api/empleados")
public class DirectorioController {

    private final EmpleadoRepository repo;

    public DirectorioController(EmpleadoRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<EmpleadoResumenDto> list(HttpSession session) {
        Sesion.empleadoId(session);
        return repo.findAll().stream()
                .sorted(Comparator.comparing(Empleado::getNombre, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .map(EmpleadoResumenDto::from)
                .toList();
    }
}
