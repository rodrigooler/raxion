# RAXION Devnet Deploy Pipeline
# ==============================
#
# Quick commands:
#   make docker-build     # Build Docker image
#   make docker-shell     # Enter Docker shell
#   make build            # Build programs (inside Docker)
#   make deploy           # Deploy to devnet
#   make test             # Run program tests
#   make all              # Full pipeline: build + test + deploy
#   make health           # Check devnet health
#
# Prerequisites:
#   1. Docker installed
#   2. Solana wallet at ~/.config/solana/id.json
#   3. SOLANA_DEVNET_AIRDROP (optional) for test funds
#
# For first-time setup:
#   make setup

.PHONY: help docker-build docker-shell build test deploy all health setup clean

# Default target
help:
	@echo "RAXION Devnet Deploy Pipeline"
	@echo ""
	@echo "Setup:"
	@echo "  make setup          First-time setup (fetch Agave)"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build   Build Docker image"
	@echo "  make docker-shell   Enter Docker shell"
	@echo ""
	@echo "Build & Deploy:"
	@echo "  make build          Build Anchor programs"
	@echo "  make test           Run program tests"
	@echo "  make deploy         Deploy to devnet"
	@echo "  make all            Full pipeline (build + test + deploy)"
	@echo ""
	@echo "Verification:"
	@echo "  make health         Check devnet health"
	@echo "  make clean          Clean build artifacts"

# Check prerequisites
_prereqs:
	@which docker >/dev/null 2>&1 || (echo "ERROR: Docker not found. Install Docker first." && exit 1)
	@if [ ! -f "$(HOME)/.config/solana/id.json" ]; then \
		echo "ERROR: Wallet not found at ~/.config/solana/id.json"; \
		echo "Create with: solana-keygen new"; \
		exit 1; \
	fi
	@echo "Prerequisites OK"

# First-time setup
setup: _prereqs
	@echo "=== RAXION Setup ==="
	@echo "Fetching Agave runtime (pinned ref)..."
	@./scripts/fetch_agave.sh
	@echo ""
	@echo "Building Docker image..."
	@$(MAKE) docker-build
	@echo ""
	@echo "Setup complete!"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Get devnet SOL: ./scripts/solana_airdrop.sh 2"
	@echo "  2. Deploy: make deploy"

# Build Docker image
docker-build: _prereqs
	@echo "=== Building Docker Image ==="
	@docker build \
		--platform linux/amd64 \
		-f ops/docker/anchor-devnet/Dockerfile \
		-t raxion/anchor-devnet:0.1 \
		.
	@echo "Docker image built: raxion/anchor-devnet:0.1"

# Enter Docker shell
docker-shell: _prereqs
	@echo "=== Entering Docker Shell ==="
	@echo "Wallet: ~/.config/solana/id.json"
	@echo "Workdir: $$(pwd)"
	@echo ""
	docker run --rm -it \
		--platform linux/amd64 \
		-v "$(pwd)":/work \
		-v "$(HOME)/.config/solana":/home/raxion/.config/solana \
		-e HOME=/home/raxion \
		-e CARGO_HOME=/work/.cargo-home \
		-e PATH="/usr/local/cargo/bin:/home/raxion/.local/share/solana/install/active_release/bin:$${PATH}" \
		-w /work \
		raxion/anchor-devnet:0.1 bash

# Build Anchor programs (inside Docker)
build: _prereqs docker-build
	@echo "=== Building Anchor Programs ==="
	@./scripts/docker_deploy_poiq_devnet.sh "./scripts/deploy_poiq_devnet.sh --build-only"

# Run tests
test: _prereqs docker-build
	@echo "=== Running Program Tests ==="
	@./scripts/docker_deploy_poiq_devnet.sh "cargo test --manifest-path programs/raxion-poiq/Cargo.toml"

# Deploy to devnet
deploy: _prereqs docker-build
	@echo "=== Deploying to Devnet ==="
	@./scripts/docker_deploy_poiq_devnet.sh "./scripts/deploy_poiq_devnet.sh"

# Full pipeline: build + test + deploy
all: _prereqs docker-build
	@echo "=== Full Deploy Pipeline ==="
	@echo ""
	@echo "[1/3] Building programs..."
	@./scripts/docker_deploy_poiq_devnet.sh "./scripts/deploy_poiq_devnet.sh --build-only"
	@echo ""
	@echo "[2/3] Running tests..."
	@./scripts/docker_deploy_poiq_devnet.sh "cargo test --manifest-path programs/raxion-poiq/Cargo.toml"
	@echo ""
	@echo "[3/3] Deploying to devnet..."
	@./scripts/deploy_poiq_devnet.sh
	@echo ""
	@echo "=== Pipeline Complete ==="

# Health check
health: _prereqs
	@./scripts/deploy_health_check.sh

# Clean build artifacts
clean:
	@echo "=== Cleaning Build Artifacts ==="
	@rm -rf programs/raxion-poiq/target
	@rm -rf target
	@rm -rf .cargo-home
	@echo "Clean complete"

# Docker build without prerequisites check (for CI)
docker-build-ci:
	docker build \
		--platform linux/amd64 \
		-f ops/docker/anchor-devnet/Dockerfile \
		-t raxion/anchor-devnet:0.1 \
		.
