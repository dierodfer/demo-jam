package com.empresa.portal.web.dto;

/** Reclamación de un objeto (sin ids internos de empleado salvo el resumen público). */
public record ReclamacionDto(
        Long id,
        Long objetoId,
        String mensaje,
        String estado,
        String fecha,
        EmpleadoResumenDto reclamante) {
}
