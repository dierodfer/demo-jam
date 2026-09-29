# ---- Build ----
FROM maven:3-eclipse-temurin-25 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B clean package -DskipTests

# ---- Runtime ----
FROM eclipse-temurin:25-jre
WORKDIR /app
RUN groupadd --system app && useradd --system --gid app app
COPY --from=build /app/target/portal-empleado-1.0.0.jar app.jar

# Postgres corre como servicio "postgres" en la red de Docker Compose; las
# migraciones se montan en /migrations desde shared/migrations (ver docker-compose).
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV MIGRATIONS_PATH=/migrations
ENV SERVER_PORT=8080
EXPOSE 8080

USER app

ENTRYPOINT ["java", "-jar", "app.jar"]
