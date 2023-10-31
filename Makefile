PROJECT = hexancore

dev_up:
	docker compose -p $(PROJECT) --env-file ./docker/.env up -d
	sleep 1
	docker compose -p $(PROJECT) exec -it redis /bin/sh -c 'echo "yes" | redis-cli -a testredis --cluster create $$REDIS_NODES'
	#docker compose -p $(PROJECT) exec -it redis redis-cli -a testredis ACL SETUSER hexancore ~hexancore: allcommands -@dangerous -@admin ON '>test'

dev_down:
	docker compose -p $(PROJECT) down