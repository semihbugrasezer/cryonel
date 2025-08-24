# 🚀 CRYONEL - Non-Custodial Crypto Arbitrage & Copy Trading Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-8.15+-orange.svg)](https://pnpm.io/)
[![Docker](https://img.shields.io/badge/Docker-20.10+-blue.svg)](https://docker.com/)

A sophisticated, production-ready platform for cryptocurrency arbitrage and copy trading, built with modern web technologies and microservices architecture.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Development](#development)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Monitoring](#monitoring)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

CRYONEL is a comprehensive platform that enables users to:
- **Arbitrage Trading**: Automatically identify and execute profitable arbitrage opportunities across multiple exchanges
- **Copy Trading**: Follow and replicate successful traders' strategies in real-time
- **Portfolio Management**: Track performance, manage risk, and optimize trading strategies
- **Real-time Analytics**: Monitor market conditions, performance metrics, and trading signals

The platform is designed with security, scalability, and user experience in mind, providing a robust foundation for both retail and institutional users.

## ✨ Features

### 🔄 Arbitrage Trading
- Multi-exchange price monitoring
- Real-time opportunity detection
- Automated execution with configurable parameters
- Risk management and position sizing
- Performance analytics and reporting

### 👥 Copy Trading
- Master trader identification and verification
- Real-time strategy replication
- Customizable risk parameters
- Performance tracking and analytics
- Social features and community building

### 🛡️ Security & Compliance
- Non-custodial architecture
- Multi-factor authentication
- Rate limiting and DDoS protection
- Audit trails and compliance reporting
- Cold storage integration

### 📊 Analytics & Reporting
- Real-time portfolio tracking
- Performance metrics and benchmarking
- Risk analysis and stress testing
- Custom reporting and data export
- API access for third-party integrations

## 🏗️ Architecture

The platform follows a microservices architecture with the following components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │   API Gateway   │    │  Arbitrage     │
│   (React/TS)    │◄──►│   (Node.js)     │◄──►│  Worker        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │   PostgreSQL    │    │  Copy Trading   │
│   (SSL/TLS)     │    │   Database      │    │  Workers        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Redis Cache   │    │   Prometheus    │    │   Grafana       │
│   & Queue       │    │   Monitoring    │    │   Dashboard     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Service Components

- **Web Frontend**: React-based SPA with TypeScript and Tailwind CSS
- **API Gateway**: Node.js REST API with JWT authentication
- **Arbitrage Worker**: Automated arbitrage detection and execution
- **Copy Trading Workers**: Master and follower trading logic
- **Database**: PostgreSQL for persistent data storage
- **Cache**: Redis for session management and job queues
- **Proxy**: Nginx for load balancing and SSL termination
- **Monitoring**: Prometheus, Grafana, and Loki for observability

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context + Hooks
- **Testing**: Vitest
- **Package Manager**: pnpm

### Backend
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Authentication**: JWT with refresh tokens
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Queue**: Bull/BullMQ

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **Monitoring**: Prometheus, Grafana, Loki
- **SSL/TLS**: Let's Encrypt integration
- **Process Management**: PM2

### Development Tools
- **Package Manager**: pnpm 8.15+
- **Linting**: ESLint
- **Formatting**: Prettier
- **Git Hooks**: Husky
- **Testing**: Vitest + Testing Library

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **pnpm**: 8.15.0 or higher
- **Docker**: 20.10.0 or higher
- **Docker Compose**: 2.0.0 or higher
- **Git**: Latest version

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/cryonel.git
   cd cryonel
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration values
   ```

4. **Start development environment**
   ```bash
   make dev
   ```

5. **Access the application**
   - Web Frontend: http://localhost:3000
   - API Gateway: http://localhost:8080
   - Database: localhost:5432
   - Redis: localhost:6379

## 🛠️ Development

### Available Commands

```bash
# Development
make dev              # Start development environment
make dev-build        # Build development environment (no cache)
make dev-quick        # Quick rebuild web frontend only
make watch            # Start live file watching and auto-deployment

# Building & Deployment
make build            # Build production images
make deploy           # Deploy to production
make prod-deploy      # Build and deploy to production

# Management
make start            # Start all services
make stop             # Stop all services
make restart          # Restart all services
make status           # Show service status

# Development Tools
make web-shell        # Get shell access to web container
make api-shell        # Get shell access to API container
make db-shell         # Get shell access to database
make redis-shell      # Get shell access to Redis

# Utilities
make logs             # Show logs from all services
make clean            # Clean up Docker images and containers
make backup           # Create backup of current state
make test             # Run tests
```

### Project Structure

```
cryonel/
├── apps/                    # Application services
│   ├── web/                # React frontend application
│   │   ├── src/            # Source code
│   │   ├── public/         # Static assets
│   │   ├── dist/           # Build output
│   │   └── package.json    # Frontend dependencies
│   ├── api/                # Node.js API service
│   │   ├── src/            # Source code
│   │   ├── scripts/        # Utility scripts
│   │   └── package.json    # API dependencies
│   └── workers/            # Background worker services
│       ├── arb/            # Arbitrage worker
│       ├── copy-master/    # Copy trading master worker
│       └── copy-follower/  # Copy trading follower worker
├── infra/                  # Infrastructure configuration
│   ├── db/                 # Database initialization
│   ├── nginx/              # Nginx configuration
│   ├── postgres/           # PostgreSQL configuration
│   ├── redis/              # Redis configuration
│   ├── prometheus/         # Monitoring configuration
│   ├── grafana/            # Dashboard configuration
│   └── loki/               # Log aggregation
├── nginx/                  # Nginx proxy configuration
├── logs/                   # Application logs
├── scripts/                # Utility scripts
├── docker-compose.yml      # Production services
├── docker-compose.dev.yml  # Development services
├── Makefile                # Development commands
├── package.json            # Root package configuration
└── .env                    # Environment variables
```

### Development Workflow

1. **Feature Development**
   ```bash
   # Create feature branch
   git checkout -b feature/your-feature-name
   
   # Start development environment
   make dev
   
   # Make changes and test
   # Use make watch for auto-deployment
   
   # Run tests
   make test
   
   # Commit changes
   git add .
   git commit -m "feat: add your feature description"
   ```

2. **Testing**
   ```bash
   # Run all tests
   make test
   
   # Run specific test suites
   cd apps/web && pnpm test
   cd apps/api && pnpm test
   ```

3. **Code Quality**
   ```bash
   # Lint code
   pnpm lint
   
   # Type checking
   pnpm typecheck
   
   # Format code
   pnpm format
   ```

## 🚀 Deployment

### Production Deployment

1. **Environment Configuration**
   ```bash
   # Copy and configure environment
   cp env.example .env
   # Edit .env with production values
   ```

2. **Build and Deploy**
   ```bash
   # Build production images
   make build
   
   # Deploy to production
   make deploy
   ```

3. **Verify Deployment**
   ```bash
   # Check service status
   make status
   
   # View logs
   make logs
   ```

### Environment Variables

Key environment variables for production:

```bash
# Security
ENCRYPTION_MASTER_KEY=your-256-bit-encryption-key
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Database
POSTGRES_USER=your-db-user
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=your-database-name

# External Services
GOOGLE_CLIENT_ID=your-google-oauth-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
STRIPE_SECRET_KEY=your-stripe-secret-key

# Blockchain
SOLANA_RPC_PRIMARY=your-solana-rpc-endpoint
SOLANA_RPC_FALLBACK=your-fallback-rpc-endpoint
```

### Docker Deployment

The platform uses Docker for containerization:

```bash
# Production deployment
docker-compose up -d

# Development deployment
docker-compose -f docker-compose.dev.yml up -d

# View running containers
docker-compose ps

# View logs
docker-compose logs -f [service-name]
```

## 📚 API Documentation

### Authentication

All API endpoints require JWT authentication:

```bash
# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

# Response
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "user": { ... }
}
```

### Trading Endpoints

```bash
# Get arbitrage opportunities
GET /api/arbitrage/opportunities
Authorization: Bearer <access-token>

# Execute arbitrage trade
POST /api/arbitrage/execute
Authorization: Bearer <access-token>
{
  "opportunityId": "uuid",
  "amount": "1000",
  "strategy": "triangular"
}

# Get copy trading strategies
GET /api/copy-trading/strategies
Authorization: Bearer <access-token>

# Follow a strategy
POST /api/copy-trading/follow
Authorization: Bearer <access-token>
{
  "strategyId": "uuid",
  "allocation": "0.1"
}
```

### Portfolio Management

```bash
# Get portfolio overview
GET /api/portfolio/overview
Authorization: Bearer <access-token>

# Get performance metrics
GET /api/portfolio/performance?period=30d
Authorization: Bearer <access-token>

# Get transaction history
GET /api/portfolio/transactions?page=1&limit=50
Authorization: Bearer <access-token>
```

## 📊 Monitoring

### Metrics Collection

The platform includes comprehensive monitoring:

- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Loki**: Log aggregation and search
- **Health Checks**: Service health monitoring

### Key Metrics

- **Trading Performance**: P&L, win rate, Sharpe ratio
- **System Health**: Response times, error rates, throughput
- **Infrastructure**: CPU, memory, disk usage
- **Security**: Failed login attempts, rate limit violations

### Accessing Dashboards

```bash
# Grafana Dashboard
http://localhost:3000/grafana

# Prometheus Metrics
http://localhost:3000/prometheus

# Loki Logs
http://localhost:3000/loki
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Setup

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests for new functionality**
5. **Ensure all tests pass**
6. **Submit a pull request**

### Code Standards

- Follow TypeScript best practices
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Follow the existing code style
- Write comprehensive tests

### Testing Guidelines

- Unit tests for business logic
- Integration tests for API endpoints
- End-to-end tests for critical user flows
- Maintain test coverage above 80%

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Join community discussions on GitHub
- **Security**: Report security vulnerabilities privately

### Common Issues

1. **Port Conflicts**: Ensure ports 3000, 8080, 5432, and 6379 are available
2. **Docker Issues**: Verify Docker and Docker Compose are properly installed
3. **Environment Variables**: Check that all required environment variables are set
4. **Database Connection**: Ensure PostgreSQL is running and accessible

### Troubleshooting

```bash
# Check service status
make status

# View service logs
make logs

# Restart services
make restart

# Clean and rebuild
make clean
make install
make dev
```

## 🔮 Roadmap

### Upcoming Features

- [ ] Advanced risk management tools
- [ ] Machine learning-based opportunity detection
- [ ] Mobile application (React Native)
- [ ] Institutional trading features
- [ ] Advanced analytics and reporting
- [ ] Multi-chain support (Ethereum, Polygon, etc.)

### Performance Improvements

- [ ] Database query optimization
- [ ] Caching strategy enhancement
- [ ] Load balancing improvements
- [ ] Microservices optimization

