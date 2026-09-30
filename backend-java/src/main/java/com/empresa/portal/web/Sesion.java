package com.empresa.portal.web;

import jakarta.servlet.http.HttpSession;

/** Acceso al empleado autenticado; lanza 401 si no hay sesión. */
final class Sesion {

    private Sesion() {
    }

    static Long empleadoId(HttpSession session) {
        Object id = session.getAttribute(AuthController.SESSION_KEY);
        if (id instanceof Long empleadoId) {
            return empleadoId;
        }
        throw new ApiException(401, "No autenticado");
    }
}
