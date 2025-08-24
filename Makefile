# CRYONEL Development & Deployment Makefile

.PHONY: help install dev build deploy watch clean logs status test

# Default target
.DEFAULT_GOAL := help

# Colors for output
GREEN := \033[32m
YELLOW := \033[33m
BLUE := \033[34m
RED := \033[31m
NC := \033[0m

help: ## Show this help message
	@echo "$(GREEN)CRYONEL Development Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(BLUE)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Install dependencies and setup environment
	@echo "$(YELLOW)📦 Installing dependencies...$(NC)"
	cd apps/web && npm install
	cd apps/api && npm install
	@echo "$(GREEN)✅ Dependencies installed$(NC)"

dev: ## Start development environment with hot reload
	@echo "$(YELLOW)🔥 Starting development environment...$(NC)"
	docker-compose -f docker-compose.dev.yml up -d
	@echo "$(GREEN)✅ Development environment started$(NC)"
	@echo "$(BLUE)🌐 Web: http://localhost:3000$(NC)"
	@echo "$(BLUE)⚡ API: http://localhost:8080$(NC)"

dev-build: ## Build development environment (no cache)
	@echo "$(YELLOW)🏗️ Building development environment...$(NC)"
	./scripts/dev-build.sh

dev-quick: ## Quick rebuild web frontend only
	@echo "$(YELLOW)⚡ Quick rebuild web frontend...$(NC)"
	./scripts/dev-quick.sh

build: ## Build production images
	@echo "$(YELLOW)🏗️ Building production images...$(NC)"
	docker-compose build --no-cache
	@echo "$(GREEN)✅ Production images built$(NC)"

deploy: ## Deploy to production
	@echo "$(YELLOW)🚀 Deploying to production...$(NC)"
	./scripts/deploy.sh

watch: ## Start live file watching and auto-deployment
	@echo "$(YELLOW)👀 Starting live watch mode...$(NC)"
	@echo "$(BLUE)📋 Watch logs will be saved to /tmp/cryonel-watch.log$(NC)"
	@echo "$(BLUE)🛑 Use 'make watch-stop' to stop watching${NC}"
	@nohup ./scripts/watch-and-deploy.sh > /dev/null 2>&1 & echo $$! > /tmp/cryonel-watch.pid
	@echo "$(GREEN)✅ Watch mode started in background (PID: $$(cat /tmp/cryonel-watch.pid))$(NC)"

watch-stop: ## Stop live file watching
	@echo "$(YELLOW)🛑 Stopping live watch mode...$(NC)"
	@if [ -f /tmp/cryonel-watch.pid ]; then \
		kill $$(cat /tmp/cryonel-watch.pid) 2>/dev/null || true; \
		rm -f /tmp/cryonel-watch.pid; \
		echo "$(GREEN)✅ Watch mode stopped$(NC)"; \
	else \
		echo "$(YELLOW)⚠️ No watch process found$(NC)"; \
	fi

watch-status: ## Show status of watch process
	@echo "$(YELLOW)📊 Watch process status:$(NC)"
	@if [ -f /tmp/cryonel-watch.pid ]; then \
		PID=$$(cat /tmp/cryonel-watch.pid); \
		if ps -p $$PID > /dev/null 2>&1; then \
			echo "$(GREEN)✅ Watch process running (PID: $$PID)$(NC)"; \
			echo "$(BLUE)📋 Recent logs:$(NC)"; \
			tail -10 /tmp/cryonel-watch.log 2>/dev/null || echo "$(YELLOW)No logs found$(NC)"; \
		else \
			echo "$(RED)❌ Watch process not running (stale PID file)$(NC)"; \
			rm -f /tmp/cryonel-watch.pid; \
		fi; \
	else \
		echo "$(YELLOW)⚠️ No watch process found$(NC)"; \
	fi

clean: ## Clean up Docker images and containers
	@echo "$(YELLOW)🧹 Cleaning up...$(NC)"
	docker-compose down
	docker system prune -f
	docker volume prune -f
	@echo "$(GREEN)✅ Cleanup completed$(NC)"

logs: ## Show logs from all services
	@echo "$(YELLOW)📋 Showing service logs...$(NC)"
	docker-compose logs -f

logs-web: ## Show web service logs
	@echo "$(YELLOW)📋 Showing web service logs...$(NC)"
	docker-compose logs -f web

logs-api: ## Show API service logs
	@echo "$(YELLOW)📋 Showing API service logs...$(NC)"
	docker-compose logs -f api

status: ## Show status of all services
	@echo "$(YELLOW)📊 Service status:$(NC)"
	docker-compose ps
	@echo ""
	@echo "$(YELLOW)💾 Disk usage:$(NC)"
	docker system df
	@echo ""
	@echo "$(YELLOW)🏥 Health checks:$(NC)"
	@curl -s http://localhost:3000 > /dev/null && echo "$(GREEN)✅ Web service healthy$(NC)" || echo "$(RED)❌ Web service down$(NC)"
	@curl -s http://localhost:8080/health > /dev/null && echo "$(GREEN)✅ API service healthy$(NC)" || echo "$(RED)❌ API service down$(NC)"

test: ## Run tests
	@echo "$(YELLOW)🧪 Running tests...$(NC)"
	cd apps/web && npm test
	cd apps/api && npm test
	@echo "$(GREEN)✅ Tests completed$(NC)"

backup: ## Create backup of current state
	@echo "$(YELLOW)💾 Creating backup...$(NC)"
	@timestamp=$$(date +%Y%m%d-%H%M%S) && \
	docker-compose ps > backups/cryonel-backup-$$timestamp.txt && \
	tar -czf backups/cryonel-files-$$timestamp.tar.gz --exclude='node_modules' --exclude='.git' . && \
	echo "$(GREEN)✅ Backup created: backups/cryonel-backup-$$timestamp.tar.gz$(NC)"

restart: ## Restart all services
	@echo "$(YELLOW)🔄 Restarting services...$(NC)"
	docker-compose restart
	@echo "$(GREEN)✅ Services restarted$(NC)"

stop: ## Stop all services
	@echo "$(YELLOW)⏹️ Stopping services...$(NC)"
	docker-compose down
	@echo "$(GREEN)✅ Services stopped$(NC)"

start: ## Start all services
	@echo "$(YELLOW)▶️ Starting services...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✅ Services started$(NC)"

# Development shortcuts
web-shell: ## Get shell access to web container
	docker-compose exec web sh

api-shell: ## Get shell access to API container
	docker-compose exec api sh

db-shell: ## Get shell access to database
	docker-compose exec db psql -U $${POSTGRES_USER:-cryonel} -d $${POSTGRES_DB:-cryonel}

redis-shell: ## Get shell access to Redis
	docker-compose exec redis redis-cli

# Environment specific targets
prod-deploy: build deploy ## Build and deploy to production

dev-reset: clean install dev ## Clean, install and start development environment

live-mode: watch ## Start live development mode with auto-deployment