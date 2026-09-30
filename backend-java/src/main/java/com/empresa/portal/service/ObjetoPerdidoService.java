package com.empresa.portal.service;

import com.empresa.portal.model.Empleado;
import com.empresa.portal.model.ObjetoPerdido;
import com.empresa.portal.model.ObjetoReclamacion;
import com.empresa.portal.repo.EmpleadoRepository;
import com.empresa.portal.repo.ObjetoPerdidoRepository;
import com.empresa.portal.repo.ObjetoReclamacionRepository;
import com.empresa.portal.web.ApiException;
import com.empresa.portal.web.dto.EmpleadoResumenDto;
import com.empresa.portal.web.dto.ObjetoDto;
import com.empresa.portal.web.dto.ObjetoInput;
import com.empresa.portal.web.dto.ReclamacionDto;
import com.empresa.portal.web.dto.ResumenObjetosDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Reglas de negocio de objetos perdidos, reclamaciones y entregas. */
@Service
public class ObjetoPerdidoService {

    public static final Set<String> TIPOS = Set.of("perdido", "encontrado");
    public static final Set<String> CATEGORIAS =
            Set.of("llaves", "movil", "cartera", "ropa", "auriculares", "documentos", "otros");
    public static final Set<String> SECCIONES =
            Set.of("recepcion", "planta1", "planta2", "sala-reuniones", "cocina", "parking", "otras");

    static final String ABIERTO = "abierto";
    static final String ENTREGADO = "entregado";
    static final String PENDIENTE = "pendiente";
    static final String ACEPTADA = "aceptada";
    static final String RECHAZADA = "rechazada";
    static final int DIAS_NOVEDAD = 7;

    private final ObjetoPerdidoRepository objetos;
    private final ObjetoReclamacionRepository reclamaciones;
    private final EmpleadoRepository empleados;

    public ObjetoPerdidoService(ObjetoPerdidoRepository objetos,
                                ObjetoReclamacionRepository reclamaciones,
                                EmpleadoRepository empleados) {
        this.objetos = objetos;
        this.reclamaciones = reclamaciones;
        this.empleados = empleados;
    }

    /** Filtros opcionales del listado; los nulos no filtran. */
    public record Filtros(String tipo, String estado, String categoria, String seccion,
                          String q, boolean mios, boolean reclamados) {
    }

    @Transactional(readOnly = true)
    public List<ObjetoDto> listar(Long viewerId, Filtros f) {
        Contexto ctx = contexto();
        String q = f.q() == null ? "" : f.q().trim().toLowerCase();
        return objetos.findAllByOrderByIdDesc().stream()
                .filter(o -> f.tipo() == null || f.tipo().equals(o.getTipo()))
                .filter(o -> f.estado() == null || f.estado().equals(o.getEstado()))
                .filter(o -> f.categoria() == null || f.categoria().equals(o.getCategoria()))
                .filter(o -> f.seccion() == null || f.seccion().equals(o.getSeccion()))
                .filter(o -> !f.mios() || o.getPublicadorId().equals(viewerId))
                .filter(o -> !f.reclamados() || ctx.reclamacionDe(o.getId(), viewerId) != null)
                .filter(o -> q.isEmpty() || contiene(o, q))
                .map(o -> ctx.dto(o, viewerId))
                .toList();
    }

    @Transactional(readOnly = true)
    public ObjetoDto obtener(Long viewerId, Long id) {
        return contexto().dto(existente(id), viewerId);
    }

    @Transactional
    public ObjetoDto crear(Long publicadorId, ObjetoInput in) {
        ObjetoPerdido o = new ObjetoPerdido();
        o.setPublicadorId(publicadorId);
        o.setEstado(ABIERTO);
        o.setFechaPublicacion(LocalDate.now().toString());
        aplicar(o, in);
        objetos.save(o);
        return contexto().dto(o, publicadorId);
    }

    @Transactional
    public ObjetoDto actualizar(Long viewerId, Long id, ObjetoInput in) {
        ObjetoPerdido o = propio(id, viewerId);
        exigirAbierto(o);
        aplicar(o, in);
        objetos.save(o);
        return contexto().dto(o, viewerId);
    }

    @Transactional
    public void eliminar(Long viewerId, Long id) {
        ObjetoPerdido o = propio(id, viewerId);
        reclamaciones.deleteByObjetoId(o.getId());
        objetos.delete(o);
    }

    /**
     * Cierra el objeto entregándolo a la contraparte: acepta sus reclamaciones
     * pendientes y rechaza las del resto.
     */
    @Transactional
    public ObjetoDto entregar(Long viewerId, Long id, Long contraparteId) {
        ObjetoPerdido o = propio(id, viewerId);
        exigirAbierto(o);
        if (contraparteId == null || !empleados.existsById(contraparteId)) {
            throw new ApiException(400, "El destinatario no existe");
        }
        if (contraparteId.equals(viewerId)) {
            throw new ApiException(400, "El destinatario no puede ser el publicador");
        }
        o.setEstado(ENTREGADO);
        o.setContraparteId(contraparteId);
        o.setFechaEntrega(LocalDate.now().toString());
        objetos.save(o);

        for (ObjetoReclamacion r : reclamaciones.findByObjetoIdOrderByIdAsc(o.getId())) {
            if (PENDIENTE.equals(r.getEstado())) {
                r.setEstado(contraparteId.equals(r.getReclamanteId()) ? ACEPTADA : RECHAZADA);
                reclamaciones.save(r);
            }
        }
        return contexto().dto(o, viewerId);
    }

    @Transactional
    public ReclamacionDto reclamar(Long viewerId, Long objetoId, String mensaje) {
        ObjetoPerdido o = existente(objetoId);
        if (o.getPublicadorId().equals(viewerId)) {
            throw new ApiException(400, "No puedes reclamar tu propio objeto");
        }
        exigirAbierto(o);
        if (reclamaciones.findByObjetoIdAndReclamanteId(objetoId, viewerId).isPresent()) {
            throw new ApiException(409, "Ya has reclamado este objeto");
        }
        ObjetoReclamacion r = new ObjetoReclamacion();
        r.setObjetoId(objetoId);
        r.setReclamanteId(viewerId);
        r.setMensaje(limpiar(mensaje));
        r.setEstado(PENDIENTE);
        r.setFecha(LocalDate.now().toString());
        reclamaciones.save(r);
        return reclamacionDto(r, mapaEmpleados());
    }

    @Transactional(readOnly = true)
    public List<ReclamacionDto> listarReclamaciones(Long viewerId, Long objetoId) {
        propio(objetoId, viewerId);
        Map<Long, Empleado> emp = mapaEmpleados();
        return reclamaciones.findByObjetoIdOrderByIdAsc(objetoId).stream()
                .map(r -> reclamacionDto(r, emp))
                .toList();
    }

    @Transactional
    public ReclamacionDto resolver(Long viewerId, Long objetoId, Long reclamacionId, String estado) {
        ObjetoPerdido o = propio(objetoId, viewerId);
        ObjetoReclamacion r = reclamaciones.findById(reclamacionId)
                .filter(x -> x.getObjetoId().equals(o.getId()))
                .orElseThrow(() -> new ApiException(404, "No encontrado"));
        if (!ACEPTADA.equals(estado) && !RECHAZADA.equals(estado)) {
            throw new ApiException(400, "El estado debe ser aceptada o rechazada");
        }
        exigirAbierto(o);
        if (!PENDIENTE.equals(r.getEstado())) {
            throw new ApiException(409, "La reclamación ya está resuelta");
        }
        r.setEstado(estado);
        reclamaciones.save(r);
        return reclamacionDto(r, mapaEmpleados());
    }

    @Transactional(readOnly = true)
    public ResumenObjetosDto resumen(Long viewerId) {
        String desde = LocalDate.now().minusDays(DIAS_NOVEDAD).toString();
        List<ObjetoPerdido> abiertos = objetos.findAllByOrderByIdDesc().stream()
                .filter(o -> ABIERTO.equals(o.getEstado()))
                .toList();
        int nuevos = (int) abiertos.stream()
                .filter(o -> !o.getPublicadorId().equals(viewerId))
                .filter(o -> o.getFechaPublicacion().compareTo(desde) >= 0)
                .count();
        int pendientes = abiertos.stream()
                .filter(o -> o.getPublicadorId().equals(viewerId))
                .mapToInt(o -> (int) reclamaciones.findByObjetoIdOrderByIdAsc(o.getId()).stream()
                        .filter(r -> PENDIENTE.equals(r.getEstado()))
                        .count())
                .sum();
        return new ResumenObjetosDto(nuevos, pendientes);
    }

    // ---- validación y utilidades ----

    private void aplicar(ObjetoPerdido o, ObjetoInput in) {
        if (in == null || in.titulo() == null || in.titulo().isBlank()) {
            throw new ApiException(400, "El título es obligatorio");
        }
        if (!TIPOS.contains(in.tipo())) {
            throw new ApiException(400, "El tipo debe ser perdido o encontrado");
        }
        if (!CATEGORIAS.contains(in.categoria())) {
            throw new ApiException(400, "La categoría no es válida");
        }
        if (!SECCIONES.contains(in.seccion())) {
            throw new ApiException(400, "La sección no es válida");
        }
        o.setTitulo(in.titulo().trim());
        o.setDescripcion(limpiar(in.descripcion()));
        o.setCategoria(in.categoria());
        o.setTipo(in.tipo());
        o.setSeccion(in.seccion());
        o.setUbicacion(limpiar(in.ubicacion()));
        o.setFechaSuceso(fechaSuceso(in.fechaSuceso()));
    }

    private String fechaSuceso(String valor) {
        if (valor == null || valor.isBlank()) {
            return LocalDate.now().toString();
        }
        try {
            return LocalDate.parse(valor).toString();
        } catch (DateTimeParseException e) {
            throw new ApiException(400, "La fecha debe tener formato YYYY-MM-DD");
        }
    }

    private String limpiar(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private ObjetoPerdido existente(Long id) {
        return objetos.findById(id).orElseThrow(() -> new ApiException(404, "No encontrado"));
    }

    /** Objeto del empleado; 404 si no existe o lo publicó otro. */
    private ObjetoPerdido propio(Long id, Long viewerId) {
        ObjetoPerdido o = existente(id);
        if (!o.getPublicadorId().equals(viewerId)) {
            throw new ApiException(404, "No encontrado");
        }
        return o;
    }

    private void exigirAbierto(ObjetoPerdido o) {
        if (!ABIERTO.equals(o.getEstado())) {
            throw new ApiException(409, "El objeto ya está entregado");
        }
    }

    private boolean contiene(ObjetoPerdido o, String q) {
        return List.of(nz(o.getTitulo()), nz(o.getDescripcion()), nz(o.getUbicacion())).stream()
                .anyMatch(v -> v.toLowerCase().contains(q));
    }

    private String nz(String s) {
        return s == null ? "" : s;
    }

    private Map<Long, Empleado> mapaEmpleados() {
        return empleados.findAll().stream().collect(Collectors.toMap(Empleado::getId, Function.identity()));
    }

    private ReclamacionDto reclamacionDto(ObjetoReclamacion r, Map<Long, Empleado> emp) {
        return new ReclamacionDto(r.getId(), r.getObjetoId(), r.getMensaje(), r.getEstado(), r.getFecha(),
                EmpleadoResumenDto.from(emp.get(r.getReclamanteId())));
    }

    private Contexto contexto() {
        return new Contexto(mapaEmpleados(), reclamaciones.findAll());
    }

    /** Datos auxiliares cargados una vez para construir varios DTOs. */
    private record Contexto(Map<Long, Empleado> empleados, List<ObjetoReclamacion> reclamaciones) {

        ObjetoReclamacion reclamacionDe(Long objetoId, Long empleadoId) {
            return reclamaciones.stream()
                    .filter(r -> r.getObjetoId().equals(objetoId) && r.getReclamanteId().equals(empleadoId))
                    .findFirst()
                    .orElse(null);
        }

        ObjetoDto dto(ObjetoPerdido o, Long viewerId) {
            boolean esMio = o.getPublicadorId().equals(viewerId);
            ObjetoReclamacion mia = reclamacionDe(o.getId(), viewerId);
            int pendientes = esMio
                    ? (int) reclamaciones.stream()
                            .filter(r -> r.getObjetoId().equals(o.getId()) && PENDIENTE.equals(r.getEstado()))
                            .count()
                    : 0;
            return new ObjetoDto(o.getId(), o.getTitulo(), o.getDescripcion(), o.getCategoria(), o.getTipo(),
                    o.getEstado(), o.getSeccion(), o.getUbicacion(), o.getFechaSuceso(), o.getFechaPublicacion(),
                    o.getFechaEntrega(),
                    EmpleadoResumenDto.from(empleados.get(o.getPublicadorId())),
                    o.getContraparteId() == null ? null : EmpleadoResumenDto.from(empleados.get(o.getContraparteId())),
                    esMio, mia == null ? null : mia.getEstado(), pendientes);
        }
    }
}
