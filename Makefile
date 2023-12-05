PROJECT = hexancore

up:
	mkdir -p ./tmp
	chmod 777 -R ./tmp
	chmod 777 -R ./docker
	docker compose -p $(PROJECT) --env-file ./docker/.env up -d
	sleep 3
	docker ps
	docker compose -p $(PROJECT) logs redis
	docker compose -p $(PROJECT) exec -it redis /bin/sh -c 'echo "yes" | redis-cli -a testredis --cluster create $$REDIS_NODES'

down:
	docker compose -p $(PROJECT) down

act:
	act workflow_dispatch --input releaseType=minor 