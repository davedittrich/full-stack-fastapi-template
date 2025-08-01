# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Environment Setup

This is a full-stack FastAPI template with Docker Compose for development. The recommended development workflow is:

```bash
# Start the full stack with hot reloading
docker compose watch

# Or for production-like testing
docker compose up -d
```

## Architecture Overview

### Backend (FastAPI + SQLModel + PostgreSQL)
- **Framework**: FastAPI with SQLModel for database ORM
- **Location**: `backend/` directory
- **Main API**: `backend/app/api/main.py` - API router configuration
- **Models**: `backend/app/models.py` - SQLModel definitions for User, Item, Challenge, Question, and FAQ entities
- **Database**: PostgreSQL with Alembic migrations
- **Authentication**: JWT-based with secure password hashing
- **CLI**: Comprehensive command-line interface using Cliff framework
- **Secrets Management**: Python-secrets (psec) for secure configuration
- **API Structure**:
  - `/api/routes/` - Route handlers (users, items, challenges, questions, login, utils)
  - `deps.py` - Dependency injection
  - `core/` - Configuration, database, security
  - `cli/` - Command-line interface modules
  - `crud.py` - Database operations

### Frontend (React + TypeScript + Chakra UI)
- **Framework**: React with TypeScript, Vite build tool
- **Location**: `frontend/` directory
- **Routing**: TanStack Router (`src/routes/`)
- **State Management**: TanStack Query for server state
- **UI Library**: Chakra UI components
- **Client Generation**: Auto-generated API client from OpenAPI schema

### Key Technologies
- **Docker**: Development and production deployment
- **Traefik**: Reverse proxy/load balancer
- **Alembic**: Database migrations
- **uv**: Python package management (backend)
- **npm**: Node.js package management (frontend)

## Essential Commands

### Backend Development
```bash
cd backend

# Install dependencies
uv sync

# Activate virtual environment
source .venv/bin/activate

# Run tests with coverage
bash ./scripts/test.sh

# Run linting (mypy + ruff)
bash ./scripts/lint.sh

# Format code
bash ./scripts/format.sh

# Individual test run
pytest app/tests/api/routes/test_users.py::test_create_user

# Database migrations
alembic revision --autogenerate -m "Description"
alembic upgrade head

# Development server (if not using docker)
fastapi dev app/main.py
```

### Tanzanite CLI Commands
```bash
# Setup python-secrets environment (recommended)
./scripts/setup-psec-env.sh

# Challenge management
tanzanite challenge create "My Challenge" --author "Author Name" --url "http://example.com" --description "Description" --date-posted "2025-01-31"
tanzanite challenge list
tanzanite challenge show <challenge-id>
tanzanite challenge update <challenge-id>
tanzanite challenge delete <challenge-id>

# Import challenges from file
tanzanite challenge create --import-file challenges.json

# Question management
tanzanite question create --challenge-id <id> --subject "Question" --description "Description"
tanzanite question list --challenge-id <id>
tanzanite question show <question-id>
tanzanite question update <question-id>
tanzanite question delete <question-id>

# User management
tanzanite user create user@example.com --full-name "User Name" --password <pass>
tanzanite user list
tanzanite user show <user-id>

# Server management
tanzanite server start --host 127.0.0.1 --port 8000 --reload
tanzanite server stop

# Database management
tanzanite db init
tanzanite db reset --force

# Authentication
tanzanite login --username admin@example.com

# General
tanzanite about
tanzanite --help
```

### Python-secrets (psec) Commands
```bash
# Environment management
psec environments create tanzanite-dev
psec environments list
psec environments path
psec environments delete <name>

# Secrets management
psec secrets generate --from-options
psec secrets show --no-redact
psec secrets set <secret-name>
psec secrets get <secret-name>

# Run commands with secrets
psec -E run -- uvicorn app.main:app --reload
psec -E run -- tanzanite challenge list
psec -E run -- alembic upgrade head
```

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Lint and format
npm run lint

# Generate API client (after backend changes)
npm run generate-client

# End-to-end tests (requires running backend)
npx playwright test
npx playwright test --ui
```

### Full Stack Commands
```bash
# Run all tests (backend + frontend)
./scripts/test.sh

# Generate frontend client from OpenAPI schema
./scripts/generate-client.sh

# Local deployment testing
./scripts/test-local.sh
```

### Docker Development Workflows
```bash
# Start development with hot reloading
docker compose watch

# Run tests in running container
docker compose exec backend bash scripts/tests-start.sh

# Interactive backend shell
docker compose exec backend bash

# Stop specific service to run locally
docker compose stop frontend  # Then run: cd frontend && npm run dev
docker compose stop backend   # Then run: cd backend && fastapi dev app/main.py
```

## Code Organization Patterns

### Backend Patterns
- **Models**: SQLModel classes in `models.py` with separate Create/Update/Public schemas
- **CRUD**: Database operations in `crud.py`
- **API Routes**: Organized by domain in `api/routes/` (users, items, login, utils)
- **Dependencies**: Common dependencies in `api/deps.py`
- **Configuration**: Environment-based config in `core/config.py`

### Frontend Patterns
- **Routing**: File-based routing in `src/routes/` with TanStack Router
- **Components**: Organized by feature in `src/components/` (Admin/, Items/, Common/, etc.)
- **API Client**: Auto-generated in `src/client/` from OpenAPI schema
- **Hooks**: Custom hooks in `src/hooks/` (useAuth, useCustomToast)
- **Theme**: Chakra UI theming in `theme.tsx` and `theme/`

## Testing Strategy

### Backend Testing
- **Framework**: pytest with coverage reporting
- **Location**: `backend/app/tests/`
- **Structure**: Mirrors app structure (api/, crud/, scripts/)
- **Coverage**: HTML reports generated in `htmlcov/`
- **Test Data**: Utilities in `tests/utils/` for creating test users/items

### Frontend Testing
- **E2E Testing**: Playwright tests in `frontend/tests/`
- **Test Setup**: Authentication helpers in `tests/auth.setup.ts`
- **Test Utilities**: Random data generation, mail testing, API helpers

## Database Management

### Migration Workflow
1. Modify models in `backend/app/models.py`
2. Create migration: `alembic revision --autogenerate -m "Description"`
3. Review generated migration file
4. Apply migration: `alembic upgrade head`
5. Commit migration files to repository

### Model Relationships
- **User-Item**: One-to-many with cascade delete
- **Authentication**: JWT tokens with secure password hashing
- **UUIDs**: Primary keys use UUID4 for all entities

## API Client Generation

The frontend uses an auto-generated TypeScript client from the backend's OpenAPI schema:

1. Backend changes automatically update OpenAPI schema
2. Run `./scripts/generate-client.sh` to update frontend client
3. Client is generated in `frontend/src/client/`
4. Commit generated files

## Environment Configuration

### Key Environment Variables
- `SECRET_KEY`: JWT signing key (change from "changethis")
- `FIRST_SUPERUSER_PASSWORD`: Admin password (change from "changethis")
- `POSTGRES_PASSWORD`: Database password (change from "changethis")
- `DOMAIN`: Set to `localhost.tiangolo.com` for subdomain testing

### Development URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Database Admin: http://localhost:8080
- Mail Catcher: http://localhost:1080

## Configuration Management

### Python-secrets (psec) - Recommended
This template supports python-secrets for secure configuration management:

**Benefits:**
- Secrets stored outside source code repository
- Multiple environment support (dev, staging, prod)
- Automatic secure secret generation
- Environment variable export for Docker compatibility
- Audit trail for secret changes

**Setup:**
```bash
# Initialize psec environment
./scripts/setup-psec-env.sh

# Generate secrets interactively
psec secrets generate --from-options

# View current configuration
psec secrets show --no-redact
```

**Configuration files:**
- `secrets.d/secrets.yml` - Secret descriptions and defaults
- `backend/app/core/psec_config.py` - Psec-based settings class
- Environment variables like `D2_ENVIRONMENT` control which psec environment to use

### Traditional .env - Fallback
The template maintains backward compatibility with `.env` files:

```bash
# Disable psec to use .env files
export TANZANITE_USE_PSEC=0

# Or if psec is not installed, it falls back automatically
```

## Security Considerations

- **Secrets Management**: Use python-secrets (psec) to keep secrets out of source code
- **JWT Authentication**: Secure token-based authentication with configurable expiration
- **Password Security**: Bcrypt hashing with secure random salt generation
- **Database Security**: SQL injection protection via SQLModel parameterized queries
- **CORS Protection**: Configurable CORS origins for frontend access
- **Environment Separation**: Different secrets per environment (dev/staging/prod)
- **Audit Trail**: Psec tracks when secrets are accessed or modified
