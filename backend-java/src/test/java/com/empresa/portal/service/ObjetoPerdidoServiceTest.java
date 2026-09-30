package com.empresa.portal.service;

import com.empresa.portal.model.ObjetoPerdido;
import com.empresa.portal.model.ObjetoReclamacion;
import com.empresa.portal.repo.EmpleadoRepository;
import com.empresa.portal.repo.ObjetoPerdidoRepository;
import com.empresa.portal.repo.ObjetoReclamacionRepository;
import com.empresa.portal.web.ApiException;
import com.empresa.portal.web.dto.ObjetoInput;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ObjetoPerdidoServiceTest {

    private static final Long PUBLICADOR = 1L;
    private static final Long OTRO = 2L;
    private static final Long TERCERO = 3L;

    private ObjetoPerdidoRepository objetos;
    private ObjetoReclamacionRepository reclamaciones;
    private EmpleadoRepository empleados;
    private ObjetoPerdidoService service;

    @BeforeEach
    void setUp() {
        objetos = mock(ObjetoPerdidoRepository.class);
        reclamaciones = mock(ObjetoReclamacionRepository.class);
        empleados = mock(EmpleadoRepository.class);
        service = new ObjetoPerdidoService(objetos, reclamaciones, empleados);
    }

    private ObjetoPerdido objeto(String estado) {
        ObjetoPerdido o = new ObjetoPerdido();
        o.setId(10L);
        o.setPublicadorId(PUBLICADOR);
        o.setTipo("encontrado");
        o.setEstado(estado);
        when(objetos.findById(10L)).thenReturn(Optional.of(o));
        return o;
    }

    private ObjetoReclamacion reclamacion(long id, long reclamanteId) {
        ObjetoReclamacion r = new ObjetoReclamacion();
        r.setId(id);
        r.setObjetoId(10L);
        r.setReclamanteId(reclamanteId);
        r.setEstado("pendiente");
        return r;
    }

    private int status(Runnable accion) {
        return assertThrows(ApiException.class, accion::run).getStatus();
    }

    @Test
    void entregarAceptaLaReclamacionDelDestinatarioYRechazaLasDemas() {
        ObjetoPerdido o = objeto("abierto");
        ObjetoReclamacion delDestinatario = reclamacion(1, OTRO);
        ObjetoReclamacion deOtro = reclamacion(2, TERCERO);
        when(empleados.existsById(OTRO)).thenReturn(true);
        when(reclamaciones.findByObjetoIdOrderByIdAsc(10L)).thenReturn(List.of(delDestinatario, deOtro));

        service.entregar(PUBLICADOR, 10L, OTRO);

        assertEquals("entregado", o.getEstado());
        assertEquals(OTRO, o.getContraparteId());
        assertEquals("aceptada", delDestinatario.getEstado());
        assertEquals("rechazada", deOtro.getEstado());
    }

    @Test
    void entregarUnObjetoYaEntregadoDevuelve409() {
        objeto("entregado");
        assertEquals(409, status(() -> service.entregar(PUBLICADOR, 10L, OTRO)));
    }

    @Test
    void entregarAUnEmpleadoInexistenteODelPropioPublicadorDevuelve400() {
        objeto("abierto");
        assertEquals(400, status(() -> service.entregar(PUBLICADOR, 10L, 99L)));
        when(empleados.existsById(PUBLICADOR)).thenReturn(true);
        assertEquals(400, status(() -> service.entregar(PUBLICADOR, 10L, PUBLICADOR)));
    }

    @Test
    void soloElPublicadorPuedeEntregarOEliminar() {
        objeto("abierto");
        assertEquals(404, status(() -> service.entregar(OTRO, 10L, TERCERO)));
        assertEquals(404, status(() -> service.eliminar(OTRO, 10L)));
        verify(objetos, never()).delete(any());
    }

    @Test
    void noSePuedeReclamarElPropioObjetoNiDosVeces() {
        objeto("abierto");
        assertEquals(400, status(() -> service.reclamar(PUBLICADOR, 10L, null)));

        when(reclamaciones.findByObjetoIdAndReclamanteId(10L, OTRO))
                .thenReturn(Optional.of(reclamacion(1, OTRO)));
        assertEquals(409, status(() -> service.reclamar(OTRO, 10L, null)));
    }

    @Test
    void noSePuedeReclamarUnObjetoEntregado() {
        objeto("entregado");
        assertEquals(409, status(() -> service.reclamar(OTRO, 10L, null)));
    }

    @Test
    void resolverExigeEstadoValidoYReclamacionPendiente() {
        objeto("abierto");
        ObjetoReclamacion resuelta = reclamacion(1, OTRO);
        resuelta.setEstado("rechazada");
        when(reclamaciones.findById(1L)).thenReturn(Optional.of(resuelta));

        assertEquals(400, status(() -> service.resolver(PUBLICADOR, 10L, 1L, "pendiente")));
        assertEquals(409, status(() -> service.resolver(PUBLICADOR, 10L, 1L, "aceptada")));
    }

    @Test
    void crearValidaTituloTipoCategoriaSeccionYFecha() {
        ObjetoInput valido = new ObjetoInput("Llaves", null, "llaves", "perdido", "recepcion", null, "2026-09-01");

        assertEquals(400, status(() -> service.crear(PUBLICADOR,
                new ObjetoInput(" ", null, "llaves", "perdido", "recepcion", null, null))));
        assertEquals(400, status(() -> service.crear(PUBLICADOR,
                new ObjetoInput("x", null, "llaves", "otro", "recepcion", null, null))));
        assertEquals(400, status(() -> service.crear(PUBLICADOR,
                new ObjetoInput("x", null, "cosa", "perdido", "recepcion", null, null))));
        assertEquals(400, status(() -> service.crear(PUBLICADOR,
                new ObjetoInput("x", null, "llaves", "perdido", "azotea", null, null))));
        assertEquals(400, status(() -> service.crear(PUBLICADOR,
                new ObjetoInput(valido.titulo(), null, "llaves", "perdido", "recepcion", null, "01/09/2026"))));
    }
}
