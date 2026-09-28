package com.empresa.portal.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.Instant;
import java.util.List;
import java.util.stream.Stream;

/**
 * Aplica en orden los ficheros .sql de shared/migrations que aún no consten en
 * la tabla schema_migration. Las migraciones aplicadas nunca se editan. Corre
 * con @Order(1), antes del DataSeeder (@Order(2)).
 */
@Component
@Order(1)
public class MigrationRunner implements CommandLineRunner {

    private final DataSource dataSource;
    private final String migrationsPath;

    public MigrationRunner(DataSource dataSource, @Value("${app.migrations.path}") String migrationsPath) {
        this.dataSource = dataSource;
        this.migrationsPath = migrationsPath;
    }

    @Override
    public void run(String... args) throws Exception {
        List<Path> files;
        try (Stream<Path> stream = Files.list(Path.of(migrationsPath))) {
            files = stream
                    .filter(p -> p.getFileName().toString().endsWith(".sql"))
                    .sorted()
                    .toList();
        }

        try (Connection conn = dataSource.getConnection()) {
            try (Statement st = conn.createStatement()) {
                st.execute("""
                        CREATE TABLE IF NOT EXISTS schema_migration (
                            version    TEXT PRIMARY KEY,
                            applied_at TEXT NOT NULL
                        )""");
            }

            for (Path file : files) {
                String version = file.getFileName().toString();
                if (isApplied(conn, version)) {
                    continue;
                }
                apply(conn, version, Files.readString(file));
            }
        }
    }

    private boolean isApplied(Connection conn, String version) throws Exception {
        try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) FROM schema_migration WHERE version=?")) {
            ps.setString(1, version);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        }
    }

    private void apply(Connection conn, String version, String sql) throws Exception {
        boolean autoCommit = conn.getAutoCommit();
        conn.setAutoCommit(false);
        try {
            try (Statement st = conn.createStatement()) {
                for (String stmt : splitStatements(sql)) {
                    st.execute(stmt);
                }
            }
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO schema_migration (version, applied_at) VALUES (?, ?)")) {
                ps.setString(1, version);
                ps.setString(2, Instant.now().toString());
                ps.executeUpdate();
            }
            conn.commit();
        } catch (Exception e) {
            conn.rollback();
            throw new IllegalStateException("migración " + version + ": " + e.getMessage(), e);
        } finally {
            conn.setAutoCommit(autoCommit);
        }
    }

    /**
     * Separa el fichero en sentencias por ";" y descarta los trozos que solo
     * contienen comentarios o espacios. Las migraciones no deben usar ";"
     * dentro de literales de texto.
     */
    static List<String> splitStatements(String sql) {
        return Stream.of(sql.split(";"))
                .filter(chunk -> chunk.lines()
                        .map(String::strip)
                        .anyMatch(line -> !line.isEmpty() && !line.startsWith("--")))
                .toList();
    }
}
