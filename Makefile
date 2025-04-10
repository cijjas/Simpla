.PHONY: up down build logs shell-db shell-api import-data test clean csv-to-db

up:
	docker-compose up -d

down:
	docker-compose down

build:
	docker-compose build

logs:
	docker-compose logs -f

shell-db:
	docker-compose exec postgres psql -U normativa -d normativa_legal

shell-api:
	docker-compose exec api bash

shell-front:
	docker-compose exec frontend sh

import-data:
	docker-compose exec api python scripts/import_data.py

csv-to-db:
	docker-compose exec api python scripts/import_data.py /app/data/base-infoleg-normativa-nacional-muestreo.csv

test:
	docker-compose exec api pytest

clean:
	docker-compose down -v