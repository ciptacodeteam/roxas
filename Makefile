.PHONY: help build dev down logs shell clean ngrok-url db-migrate db-studio prisma-studio restart rebuild

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m

help: ## Show this help message
	@echo '$(CYAN)Available commands:$(NC)'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

build: ## Build Docker images
	@echo '$(CYAN)Building Docker images...$(NC)'
	docker-compose build

dev: ## Start development environment
	@echo '$(CYAN)Starting development environment...$(NC)'
	docker-compose up -d
	@echo '$(GREEN)✅ Development environment started!$(NC)'
	@echo '$(YELLOW)App: http://localhost:3000$(NC)'
	@echo '$(YELLOW)Ngrok Dashboard: http://localhost:4040$(NC)'
	@sleep 3
	@make ngrok-url

down: ## Stop all containers
	@echo '$(CYAN)Stopping all containers...$(NC)'
	docker-compose down

stop: down ## Alias for down

logs: ## View logs from all containers
	docker-compose logs -f

logs-app: ## View logs from app container only
	docker-compose logs -f app

logs-ngrok: ## View logs from ngrok container only
	docker-compose logs -f ngrok

shell: ## Open shell in app container
	docker-compose exec app sh

shell-root: ## Open root shell in app container
	docker-compose exec -u root app sh

restart: ## Restart all containers
	@echo '$(CYAN)Restarting containers...$(NC)'
	docker-compose restart

restart-app: ## Restart app container only
	docker-compose restart app

rebuild: ## Rebuild and restart containers
	@echo '$(CYAN)Rebuilding and restarting...$(NC)'
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

clean: ## Remove all containers, volumes, and images
	@echo '$(YELLOW)⚠️  This will remove all containers, volumes, and images!$(NC)'
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		docker rmi $$(docker images -q roxas-* 2>/dev/null) 2>/dev/null || true; \
		echo '$(GREEN)✅ Cleanup complete!$(NC)'; \
	fi

ngrok-url: ## Get current ngrok public URL
	@echo '$(CYAN)Fetching ngrok URL...$(NC)'
	@sleep 2
	@URL=$$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4); \
	if [ -n "$$URL" ]; then \
		echo '$(GREEN)🌐 Ngrok URL: '"$$URL"'$(NC)'; \
		echo '$(GREEN)🎯 Webhook URL: '"$$URL"'/webhooks/xendit$(NC)'; \
	else \
		echo '$(YELLOW)⚠️  Ngrok URL not available yet. Container might still be starting...$(NC)'; \
	fi

db-migrate: ## Run database migrations
	@echo '$(CYAN)Running database migrations...$(NC)'
	docker-compose exec app bun run db:migrate

db-push: ## Push database schema changes
	@echo '$(CYAN)Pushing database schema...$(NC)'
	docker-compose exec app bun run db:push

db-generate: ## Generate Prisma client
	@echo '$(CYAN)Generating Prisma client...$(NC)'
	docker-compose exec app bun run db:generate

db-studio: ## Start Prisma Studio in app container
	@echo '$(CYAN)Starting Prisma Studio...$(NC)'
	@echo '$(YELLOW)Access at: http://localhost:5555$(NC)'
	docker-compose exec app bun run db:studio

prisma-studio: ## Start Prisma Studio as separate service
	@echo '$(CYAN)Starting Prisma Studio (separate service)...$(NC)'
	@echo '$(YELLOW)Access at: http://localhost:5556$(NC)'
	docker-compose --profile tools up -d prisma-studio
	docker-compose --profile tools logs -f prisma-studio

ps: ## Show running containers
	docker-compose ps

stats: ## Show container resource usage
	docker stats $$(docker-compose ps -q)

# Default target
.DEFAULT_GOAL := help
