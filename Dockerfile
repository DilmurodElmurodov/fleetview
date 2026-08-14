# ============================================================
# Backend — multi-stage build
# ============================================================
FROM eclipse-temurin:17-jdk AS build
WORKDIR /workspace

# Dependency layer (cached unless build files change)
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
RUN ./gradlew dependencies --no-daemon > /dev/null 2>&1 || true

COPY src ./src
RUN ./gradlew bootJar --no-daemon -x test

# ============================================================
# Runtime
# ============================================================
FROM eclipse-temurin:17-jre
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 1001 fleet
WORKDIR /app
COPY --from=build /workspace/build/libs/*.jar app.jar
USER fleet
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
    CMD curl -sf http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
