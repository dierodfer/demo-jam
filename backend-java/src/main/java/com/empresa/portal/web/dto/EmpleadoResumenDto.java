package com.empresa.portal.web.dto;

import com.empresa.portal.model.Empleado;

/** Datos públicos mínimos de un empleado (sin username ni email). */
public record EmpleadoResumenDto(Long id, String nombre, String foto, String departamento) {

    public static EmpleadoResumenDto from(Empleado e) {
        if (e == null) {
            return null;
        }
        return new EmpleadoResumenDto(e.getId(), e.getNombre(), e.getFoto(), e.getDepartamento());
    }
}
