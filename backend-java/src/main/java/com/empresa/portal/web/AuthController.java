package com.empresa.portal.web;

import com.empresa.portal.config.PasswordHasher;
import com.empresa.portal.model.Empleado;
import com.empresa.portal.repo.EmpleadoRepository;
import com.empresa.portal.web.dto.EmpleadoDto;
import com.empresa.portal.web.dto.LoginRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Login/logout. Se busca al empleado por username; si tiene contraseña
 * guardada (password_hash) debe coincidir, y si no, cualquier contraseña es
 * válida (login simulado).
 */
@RestController
@RequestMapping("/api")
public class AuthController {

    /** Id del empleado sembrado. */
    public static final long EMPLEADO_ID = 1L;
    /** Nombre del atributo de sesión que marca al usuario autenticado. */
    public static final String SESSION_KEY = "empleadoId";

    private final EmpleadoRepository repo;

    public AuthController(EmpleadoRepository repo) {
        this.repo = repo;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest body, HttpSession session) {
        String username = body == null ? null : body.username();
        Empleado empleado = username == null ? null : repo.findByUsername(username).orElse(null);

        if (empleado == null || !passwordValida(empleado, body.password())) {
            return ResponseEntity.status(401).body(Map.of("error", "Usuario o contraseña no válidos"));
        }

        session.setAttribute(SESSION_KEY, empleado.getId());
        return ResponseEntity.ok(EmpleadoDto.from(empleado));
    }

    private boolean passwordValida(Empleado empleado, String password) {
        String hash = empleado.getPasswordHash();
        return hash == null || PasswordHasher.matches(password, hash);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpSession session, HttpServletResponse response) {
        session.invalidate();
        return ResponseEntity.noContent().build();
    }
}
