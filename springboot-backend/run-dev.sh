#!/usr/bin/env bash
set -euo pipefail
[ -f ".env" ] && { set -a; source .env; set +a; }
./mvnw -U -DskipTests clean package
./mvnw spring-boot:run
