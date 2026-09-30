package com.empresa.portal.config;

import com.empresa.portal.model.Certificacion;
import com.empresa.portal.model.Empleado;
import com.empresa.portal.repo.CertificacionRepository;
import com.empresa.portal.repo.EmpleadoRepository;
import com.empresa.portal.web.AuthController;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Siembra al empleado admin (id=1) y sus certificaciones al arrancar si no
 * existen. Corre con @Order(2), después de las migraciones (@Order(1)); el
 * usuario sherpai lo crea la migración 003.
 */
@Component
@Order(2)
public class DataSeeder implements CommandLineRunner {

    private final EmpleadoRepository repo;
    private final CertificacionRepository certRepo;
    private final String seedUsername;

    public DataSeeder(EmpleadoRepository repo, CertificacionRepository certRepo,
                      @Value("${app.seed.username}") String seedUsername) {
        this.repo = repo;
        this.certRepo = certRepo;
        this.seedUsername = seedUsername;
    }

    @Override
    public void run(String... args) {
        if (!repo.existsById(AuthController.EMPLEADO_ID)) {
            Empleado e = new Empleado();
            e.setId(AuthController.EMPLEADO_ID);
            e.setUsername(seedUsername);
            e.setNombre("Ana García");
            e.setEmail("ana.garcia@empresa.com");
            e.setTelefono("+34 600 123 456");
            e.setPuesto("Desarrolladora Full Stack");
            e.setDepartamento("Tecnología");
            e.setDireccion("Calle Mayor 1, 28013 Madrid");
            e.setFoto("https://i.pravatar.cc/300?u=ana.garcia");
            repo.save(e);
        }

        seedDemoUser("maria", "María López", "maria.lopez@empresa.com", "+34 600 100 003",
                "Analista de Personas", "Recursos Humanos", "https://i.pravatar.cc/300?u=maria.lopez");
        seedDemoUser("carlos", "Carlos Ruiz", "carlos.ruiz@empresa.com", "+34 600 100 004",
                "Analista Financiero", "Finanzas", "https://i.pravatar.cc/300?u=carlos.ruiz");
        seedDemoUser("lucia", "Lucía Martín", "lucia.martin@empresa.com", "+34 600 100 005",
                "Diseñadora UX", "Producto", "https://i.pravatar.cc/300?u=lucia.martin");

        if (certRepo.count() == 0) {
            certRepo.save(cert("AWS Certified Developer – Associate", "AWS", "2025-11-17"));
            certRepo.save(cert("AWS Certified Solutions Architect – Associate", "AWS", "2025-11-17"));
            certRepo.save(cert("AWS Certified SysOps Administrator – Associate", "AWS", "2025-11-17"));
            certRepo.save(cert("Certificado PRL", "Avanta", "2026-05-29"));
        }
    }

    private void seedDemoUser(String username, String nombre, String email, String telefono,
                              String puesto, String departamento, String foto) {
        if (repo.findByUsername(username).isPresent()) {
            return;
        }
        long id = repo.findAll().stream()
                .map(Empleado::getId)
                .filter(java.util.Objects::nonNull)
                .mapToLong(Long::longValue)
                .max()
                .orElse(0L) + 1;
        Empleado empleado = new Empleado();
        empleado.setId(id);
        empleado.setUsername(username);
        empleado.setPasswordHash(PasswordHasher.hash("1234"));
        empleado.setNombre(nombre);
        empleado.setEmail(email);
        empleado.setTelefono(telefono);
        empleado.setPuesto(puesto);
        empleado.setDepartamento(departamento);
        empleado.setDireccion("Calle Mayor 1, 28013 Madrid");
        empleado.setFoto(foto);
        repo.save(empleado);
    }

    private Certificacion cert(String conocimiento, String empresa, String fecha) {
        Certificacion c = new Certificacion();
        c.setEmpleadoId(AuthController.EMPLEADO_ID);
        c.setConocimiento(conocimiento);
        c.setEmpresaEmisora(empresa);
        c.setFecha(fecha);
        return c;
    }
}
