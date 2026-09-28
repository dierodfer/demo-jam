# Portal de Empleado — Makefile

COMPOSE_BASE       = docker compose -f docker-compose.yml
COMPOSE_JAVA_REACT = docker compose -f docker-compose.yml -f docker-compose.java-react.yml

.PHONY: help install install-java install-react \
        dev run-java run-react \
        db-up db-down verify verify-java \
        up-java-react down-java-react clean

help: ## Muestra esta ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

## ---- Instalación / compilación ----

install: install-java install-react ## Prepara Java y las dependencias de React

install-java: ## Compila el backend Java (mvn package)
	cd backend-java && mvn -B clean package -DskipTests

install-react: ## Instala dependencias del frontend React
	cd frontend-react && npm install

## ---- Base de datos ----

db-up: ## Levanta solo PostgreSQL (necesario para run-java/dev)
	$(COMPOSE_BASE) up -d --wait postgres

db-down: ## Para PostgreSQL
	$(COMPOSE_BASE) down

## ---- Desarrollo local ----

dev: db-up ## Arranca Java y React en local contra PostgreSQL (Ctrl-C para parar)
	@echo "Backend: Java :8080 — Frontend: React :5173"
	@( cd backend-java && mvn -q spring-boot:run ) & \
	 ( cd frontend-react && npm run dev ) & \
	 wait

run-java: ## Arranca solo el backend Java (8080; requiere make db-up)
	cd backend-java && mvn -q spring-boot:run

run-react: ## Arranca solo el frontend React (5173, dev server contra backend Java)
	cd frontend-react && npm run dev

## ---- Tests de contrato (requieren el backend arrancado) ----

verify: ## Ejecuta los tests de contrato contra el backend Java (8080)
	node scripts/contract-test.mjs http://localhost:8080

verify-java: verify ## Alias compatible para los tests del backend Java

## ---- Docker: stack Java + React ----

up-java-react: ## Levanta postgres + backend-java (8080) + frontend-react estático (5173)
	$(COMPOSE_JAVA_REACT) up --build -d

down-java-react: ## Para el stack Java + React
	$(COMPOSE_JAVA_REACT) down

## ---- Limpieza ----

clean: ## Limpia artefactos de build de Java y React
	cd backend-java && mvn -q clean || true
	rm -rf frontend-react/dist
	@echo "Artefactos limpiados. (node_modules y el volumen de Postgres se conservan)"
