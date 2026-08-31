# Stage 1: Build Java Application with Maven
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

# Stage 2: Minimal Production JRE Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /app/target/*.jar app.jar

ENV PORT=10000
EXPOSE 10000

ENTRYPOINT ["sh", "-c", "java -Xms256m -Xmx768m -Dserver.port=${PORT:-10000} -jar app.jar"]
