package com.empresa.portal.web.dto;

/** Cuerpo de POST /api/login. La contraseña solo se valida si el empleado tiene hash guardado. */
public record LoginRequest(String username, String password) {
}
