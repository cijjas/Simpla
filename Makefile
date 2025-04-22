# -------------------------- GLOBAL SETTINGS --------------------------- #
# Default to dev
ENV ?= dev
COMPOSE = docker compose -f docker-compose.base.yml -f docker-compose.$(ENV).yml --env-file ".env.$(ENV)"

.DEFAULT_GOAL := help         # typing just `make` prints the help table
.SILENT:                      # cleaner output – we echo manually





# --------------------------------------------------------------------- #
# Core life‑cycle targets (unchanged)                                   #
# --------------------------------------------------------------------- #
.PHONY: up down build logs shell-db shell-api shell-front import-data \
        csv-to-db test clean

up:                ## Start the stack for $(ENV) (ENV=prod for production)
	@echo "🚀  Bringing up entire stack…"
	$(COMPOSE) up -d --build

down:              ## Stop and remove containers (keeps volumes)
	@echo "🛑  Stopping containers…"
	$(COMPOSE) down

build:             ## Build all images
	@echo "🔨  Building every image…"
	$(COMPOSE) build

logs:              ## Tail logs from every service
	$(COMPOSE) logs -f

shell-db:          ## psql into the Postgres container
	@echo "🐘  Opening psql shell…"
	$(COMPOSE) exec postgres psql -U normativa -d normativa_legal

shell-api:         ## Bash into the API container
	@echo "🐍  Opening API container shell…"
	$(COMPOSE) exec api bash

shell-front:       ## Shell into the Front‑end container
	@echo "🖥️   Opening Front‑end container shell…"
	$(COMPOSE) exec frontend sh

import-data:       ## Import all 3 required CSVs inside API container
	@echo "📥  Importing full InfoLeg dataset (3 files)…"
	$(COMPOSE) exec api python scripts/import_data.py /app/data

test:              ## Run pytest suite inside API
	@echo "🧪  Running back‑end tests…"
	$(COMPOSE) exec api pytest
clean:             ## Stop containers & remove volumes, images, and networks
	@echo "💣  Nuking containers, volumes, images, and networks…"
	$(COMPOSE) down -v --rmi all --remove-orphans
	docker volume prune -f
	docker network prune -f

# --------------------------------------------------------------------- #
# NEW:  Fine‑grained build / (re)start helpers                          #
# --------------------------------------------------------------------- #
.PHONY: build-api build-db build-front rebuild-api rebuild-front \
        restart-api restart-db restart-front migrate

build-api:         ## docker‑build only the API image
	@echo "🔨  Building API image…"
	$(COMPOSE) build api

build-db:          ## docker‑build only the Postgres image (rarely needed)
	@echo "🔨  Building Postgres image…"
	$(COMPOSE) build postgres

build-front:       ## docker‑build only the Front‑end image
	@echo "🔨  Building Front‑end image…"
	$(COMPOSE) build frontend

rebuild-api:       ## Re‑build API image & restart API container
	@echo "♻️   Rebuilding API image and restarting container…"
	$(COMPOSE) up -d --build api

rebuild-front:     ## Re‑build Front‑end image & restart its container
	@echo "♻️   Rebuilding Front‑end image and restarting container…"
	$(COMPOSE) up -d --build frontend

restart-api:       ## Restart API container without rebuilding
	@echo "🔄  Restarting API container…"
	$(COMPOSE) restart api

restart-db:        ## Restart Postgres (careful – drops connections)
	@echo "🔄  Restarting Postgres container…"
	$(COMPOSE) restart postgres

restart-front:     ## Restart Front‑end container
	@echo "🔄  Restarting Front‑end container…"
	$(COMPOSE) restart frontend


# --------------------------------------------------------------------- #
# NEW:  Alembic migrations                                              #
# --------------------------------------------------------------------- #
migrate:           ## Generate & apply DB migration (requires ALEMBIC cmd)
	@echo "📚  Autogenerating Alembic revision…"
	$(COMPOSE) exec api alembic revision --autogenerate -m \"auto\"
	@echo "🚀  Applying latest Alembic migration…"
	$(COMPOSE) exec api alembic upgrade head


# --------------------------------------------------------------------- #
# Pretty help message                                                   #
# --------------------------------------------------------------------- #
help:              ## Show this help
	@printf "\033[1mAvailable targets:\033[0m\n"
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | \
	  awk -F':.*## ' '{printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'