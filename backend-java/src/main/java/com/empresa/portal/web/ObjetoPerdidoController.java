package com.empresa.portal.web;

import com.empresa.portal.service.ObjetoPerdidoService;
import com.empresa.portal.service.ObjetoPerdidoService.Filtros;
import com.empresa.portal.web.dto.EntregaInput;
import com.empresa.portal.web.dto.ObjetoDto;
import com.empresa.portal.web.dto.ObjetoInput;
import com.empresa.portal.web.dto.ReclamacionDto;
import com.empresa.portal.web.dto.ReclamacionInput;
import com.empresa.portal.web.dto.ReclamacionUpdate;
import com.empresa.portal.web.dto.ResumenObjetosDto;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Objetos perdidos y encontrados: visibles para todos los empleados; solo el publicador los gestiona. */
@RestController
@RequestMapping("/api/objetos-perdidos")
public class ObjetoPerdidoController {

    private final ObjetoPerdidoService service;

    public ObjetoPerdidoController(ObjetoPerdidoService service) {
        this.service = service;
    }

    @GetMapping
    public List<ObjetoDto> list(@RequestParam(required = false) String tipo,
                                @RequestParam(required = false) String estado,
                                @RequestParam(required = false) String categoria,
                                @RequestParam(required = false) String seccion,
                                @RequestParam(required = false) String q,
                                @RequestParam(defaultValue = "false") boolean mios,
                                @RequestParam(defaultValue = "false") boolean reclamados,
                                HttpSession session) {
        Long empleadoId = Sesion.empleadoId(session);
        return service.listar(empleadoId, new Filtros(tipo, estado, categoria, seccion, q, mios, reclamados));
    }

    @GetMapping("/resumen")
    public ResumenObjetosDto resumen(HttpSession session) {
        return service.resumen(Sesion.empleadoId(session));
    }

    @GetMapping("/{id}")
    public ObjetoDto get(@PathVariable Long id, HttpSession session) {
        return service.obtener(Sesion.empleadoId(session), id);
    }

    @PostMapping
    public ResponseEntity<ObjetoDto> create(@RequestBody ObjetoInput body, HttpSession session) {
        return ResponseEntity.status(201).body(service.crear(Sesion.empleadoId(session), body));
    }

    @PutMapping("/{id}")
    public ObjetoDto update(@PathVariable Long id, @RequestBody ObjetoInput body, HttpSession session) {
        return service.actualizar(Sesion.empleadoId(session), id, body);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, HttpSession session) {
        service.eliminar(Sesion.empleadoId(session), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/entrega")
    public ObjetoDto entregar(@PathVariable Long id, @RequestBody EntregaInput body, HttpSession session) {
        return service.entregar(Sesion.empleadoId(session), id, body == null ? null : body.contraparteId());
    }

    @GetMapping("/{id}/reclamaciones")
    public List<ReclamacionDto> reclamaciones(@PathVariable Long id, HttpSession session) {
        return service.listarReclamaciones(Sesion.empleadoId(session), id);
    }

    @PostMapping("/{id}/reclamaciones")
    public ResponseEntity<ReclamacionDto> reclamar(@PathVariable Long id,
                                                   @RequestBody(required = false) ReclamacionInput body,
                                                   HttpSession session) {
        String mensaje = body == null ? null : body.mensaje();
        return ResponseEntity.status(201).body(service.reclamar(Sesion.empleadoId(session), id, mensaje));
    }

    @PutMapping("/{id}/reclamaciones/{reclamacionId}")
    public ReclamacionDto resolver(@PathVariable Long id, @PathVariable Long reclamacionId,
                                   @RequestBody ReclamacionUpdate body, HttpSession session) {
        return service.resolver(Sesion.empleadoId(session), id, reclamacionId, body == null ? null : body.estado());
    }
}
