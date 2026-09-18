# Organizador de Eventos Independientes

Archetype generado siguiendo Arquitectura Hexagonal (Puertos y Adaptadores)
sobre un monolito modular, según el SAD acordado (ver ADR-01 a ADR-06 en el
historial de la conversación de diseño). El backend (Java 21 + Spring Boot)
aísla la lógica de negocio crítica — el motor de detección de sobrecarga
diaria (US-013) y el motor de priorización de "Vista Hoy" (US-010) — en
Domain Services sin dependencias de framework, testeables en aislamiento
total. El frontend (React + TypeScript) consume la API REST vía JWT.

## 1. Prerrequisitos

- Docker >= 24.0
- Docker Compose >= 2.20 (plugin `docker compose`)
- Java 21 y Maven 3.9+ (solo si se quiere ejecutar el backend sin Docker)
- Node.js 20 LTS (solo si se quiere ejecutar el frontend sin Docker)

## 2. Arranque rápido

```bash
git clone <url-del-repositorio>
cd organizador-eventos
cp .env.example .env
# Edita .env y reemplaza JWT_SECRET y DB_PASSWORD con valores propios
docker compose up --build
```

- Backend: http://localhost:8080
- Frontend: http://localhost:5173

## 3. Ejecutar los tests localmente (sin Docker)

```bash
cd backend
mvn test
```

Los tests de dominio y aplicación (`ConflictoSobrecargaServiceTest`,
`ReglasPrioridadChainTest`, `ReprogramarSubtareaUseCaseTest`) NO requieren
base de datos — usan Mockito. El test de integración
(`JpaEventoRepositoryAdapterIT`) levanta un PostgreSQL real vía
Testcontainers automáticamente; requiere Docker disponible en la máquina
que ejecuta los tests.

## 4. Generar y ver el reporte de cobertura

```bash
cd backend
mvn test jacoco:report
# Abrir: backend/target/site/jacoco/index.html
```

La build falla (`mvn verify`) si la cobertura de línea de
`domain.*` o `application.*` cae por debajo del 100% (configurado en
`pom.xml`, plugin `jacoco-maven-plugin`, goal `check`).

## 5. Estructura del proyecto anotada

Ver el Blueprint completo acordado en la fase de diseño. Resumen:

```
backend/src/main/java/com/organizadoreventos/
├── domain/          → Reglas de negocio puras, sin dependencias externas
├── application/     → Casos de uso, orquestan el dominio y los puertos
└── infrastructure/  → Adaptadores (REST, JPA, seguridad) — el único lugar
                        que conoce Spring, PostgreSQL o JWT

frontend/src/
├── api/             → Cliente HTTP tipado hacia el backend
├── domain/types.ts  → Espejo de los DTOs del backend
└── features/        → Un módulo por User Story agrupada
```

## 6. Decisiones arquitectónicas clave (resumen)

| Decisión | Razón |
|---|---|
| Hexagonal / monolito modular | Un solo bounded context; aísla el motor de reglas para tests puros |
| PostgreSQL + `@Transactional` | R-05: atomicidad del recálculo de sobrecarga diaria |
| Motor de sobrecarga sin caché | R-01: nunca reutilizar un resultado obsoleto |
| JWT stateless | API REST + SPA, sin sesiones de servidor |
| `CalendarioExternoPort` sin adaptador | US-023 diferido; el puerto queda listo para no romper el dominio al implementarlo después |

## 7. Limitaciones conocidas y próximos pasos

- **`SugerenciaReprogramacionService`** (US-015, mitigación R-03) está
  implementado en el dominio pero **no tiene endpoint REST ni pantalla**
  todavía — es el siguiente caso de uso natural a exponer.
- El frontend cubre el flujo crítico (login, crear evento, agregar/reprogramar
  subtareas, Vista Hoy, alerta de conflicto) con estilos mínimos; falta
  pulir UI/UX y añadir manejo de errores de red más granular.
- No hay paginación en `GET /api/eventos` — aceptable para el volumen de un
  organizador individual (BAJA escalabilidad, según SAD), a revisar si el
  alcance crece.
- El endpoint de progreso (`PATCH .../progreso`) no dispara aún ninguna
  notificación de resumen diario (US-022, prioridad *Could*) — queda fuera
  del MVP de este archetype.
- `CalendarioExternoPort` (US-023) no tiene adaptador — implementarlo es
  agregar una nueva clase en `infrastructure/out/` sin tocar el dominio.
- Falta test unitario para `SugerenciaReprogramacionService` y para los
  Use Cases de Evento (Crear/Editar/Eliminar/Listar) — el archetype prioriza
  el flujo transaccional de referencia (R2); completar el resto del 100%
  de cobertura exigido por R3 antes de producción.
