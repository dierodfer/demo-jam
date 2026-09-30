package com.empresa.portal.web.dto;

/** Objeto perdido o encontrado tal y como lo ve el empleado de la sesión. */
public record ObjetoDto(
        Long id,
        String titulo,
        String descripcion,
        String categoria,
        String tipo,
        String estado,
        String seccion,
        String ubicacion,
        String fechaSuceso,
        String fechaPublicacion,
        String fechaEntrega,
        EmpleadoResumenDto publicador,
        EmpleadoResumenDto contraparte,
        boolean esMio,
        String miReclamacion,
        int reclamacionesPendientes) {
}
