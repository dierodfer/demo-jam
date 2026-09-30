package com.empresa.portal.web.dto;

/** Campos editables de un objeto. La fecha del suceso es YYYY-MM-DD y es opcional. */
public record ObjetoInput(
        String titulo,
        String descripcion,
        String categoria,
        String tipo,
        String seccion,
        String ubicacion,
        String fechaSuceso) {
}
