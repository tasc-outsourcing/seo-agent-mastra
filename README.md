# TASC Blog Article Agent v2

A comprehensive AI-powered blog article creation system built with Next.js and the Mastra framework, specifically designed for TASC (Technical Analysis and Strategic Consulting). This system provides automated SEO-optimized content generation with enterprise-grade security and professional quality standards.

## 🚀 Features

### Content Creation
- **AI-Powered Writing**: Multiple specialized agents for different aspects of content creation
- **SEO Optimization**: Built-in SEO analyzer with scoring algorithms
- **Research Integration**: Unified research tool with web search and deep analysis
- **Human-in-the-Loop**: Workflow suspension points for quality control

### Technical Features
- **Enterprise Security**: Authentication, input validation, rate limiting
- **Docker Support**: Containerized development and production environments
- **Comprehensive Testing**: 100+ tests covering security, SEO, and functionality
- **API Documentation**: Full Swagger/OpenAPI documentation
- **Real-time Streaming**: SSE support for workflow progress updates

### SEO Capabilities
- **Content Analysis**: Readability, keyword density, structure optimization
- **Technical SEO**: Meta tags, headings, URL optimization
- **Advanced Features**: Semantic keywords, content freshness, external links
- **Scoring System**: 0-100 score with actionable recommendations

## 📋 Prerequisites

- Node.js 18+ and npm
- OpenAI API key (required)
- Optional: Docker and Docker Compose
- Optional: Clerk account for authentication
- Optional: Exa API key for enhanced search
- Optional: Google service account for Docs export
- Optional: MongoDB for article storage

## 🛠️ Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd agent-starter-main

# Copy environment variables
cp .env.example .env.local

# Edit .env.local and add your API keys

# Start with Docker
make dev
```

### Native Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your API keys

# Run development servers
npm run dev
```

### Accessing the Application

- **Frontend**: [http://localhost:3000](http://localhost:3000) - Main application
- **Mastra Backend**: [http://localhost:4111](http://localhost:4111) - Agent playground
- **API Docs**: [http://localhost:4111/swagger-ui](http://localhost:4111/swagger-ui)

## 🔧 Environment Configuration

### Required Variables

```bash
# OpenAI API key for AI agents
OPENAI_API_KEY=sk-...

# Database URL (SQLite by default)
DATABASE_URL=file:./storage.db
```

### Optional Services

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Enhanced Web Search
EXA_API_KEY=exa_...

# Google Docs Export
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_DRIVE_FOLDER_ID=...

# MongoDB Storage
MONGODB_URI=mongodb://localhost:27017/tasc-blog

# Turso Database (alternative to SQLite)
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
```

## 🏗️ Architecture

### Agents
- **Blog Article Agent**: Main content creation agent
- **SEO Orchestrator**: Coordinates the SEO workflow
- **SEO Research Agent**: Keyword and topic research
- **SEO Structure Agent**: Content structure optimization
- **SEO Content Agent**: Content writing and optimization
- **SEO Optimization Agent**: Final optimization pass

### Workflows
- **Blog Research Workflow**: Human-in-the-loop research process
- **SEO Article Workflow**: Automated SEO-optimized article creation

### Tools
- **Unified Research Tool**: Consolidated research capabilities
- **TASC Context Tool**: Company guidelines and standards

### Security
- Environment variable validation with Zod
- Input sanitization for XSS prevention
- Rate limiting (100 req/min)
- Authentication on all API routes
- Security headers on responses
- Audit logging

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm test src/lib/__tests__/security.test.ts
npm test src/lib/__tests__/env.test.ts
npm test src/lib/seo-analyzer/__tests__
npm test src/mastra/agents/__tests__
npm test src/mastra/tools/__tests__
npm test src/mastra/workflows/__tests__

# Run linting
npm run lint
```

## 📚 API Documentation

### Articles API
- `GET /api/articles` - List articles
- `POST /api/articles` - Create article
- `GET /api/articles/[id]` - Get article
- `PUT /api/articles/[id]` - Update article
- `DELETE /api/articles/[id]` - Delete article
- `POST /api/articles/[id]/export-google-doc` - Export to Google Docs

### Workflow API
- `POST /api/workflow/seo-article` - Execute SEO workflow
- `GET /api/workflow/seo-article` - Get workflow info
- `POST /api/workflow/seo-article/stream` - Execute with streaming

All endpoints require authentication and include rate limiting.

## 🐳 Docker Commands

```bash
# Development
make dev          # Start development environment
make logs         # View logs
make stop         # Stop services

# Production
make prod         # Start production environment
make build        # Build images

# Maintenance
make clean        # Remove containers and volumes
make rebuild      # Clean rebuild
```

## 🚀 Deployment

### Production Checklist
1. Set all required environment variables
2. Enable authentication (Clerk)
3. Configure production database
4. Set up monitoring and logging
5. Configure rate limiting
6. Enable HTTPS

### Docker Production
```bash
# Build and run production
make prod
```

### Vercel Deployment
```bash
# Deploy to Vercel
vercel --prod
```

## 🛡️ Security Features

- **Authentication**: Clerk integration for user management
- **Authorization**: Role-based access control ready
- **Input Validation**: Zod schemas on all endpoints
- **Rate Limiting**: Configurable per-endpoint limits
- **Security Headers**: XSS, CSRF, clickjacking protection
- **Audit Logging**: Security event tracking
- **Environment Security**: Validated env variables

## 📖 Documentation

- [CLAUDE.md](../CLAUDE.md) - AI assistant instructions
- [ARCHITECTURE_ANALYSIS.md](ARCHITECTURE_ANALYSIS.md) - System architecture
- [SECURITY_AUDIT.md](SECURITY_AUDIT.md) - Security documentation
- [README-DOCKER.md](README-DOCKER.md) - Docker setup guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Update documentation
6. Submit a pull request

## 📞 Support

- Review the documentation in `/docs`
- Check the example implementations
- Submit issues on GitHub
- Contact TASC technical team

## 📄 License

Proprietary - TASC (Technical Analysis and Strategic Consulting)

---

Built with ❤️ for TASC by the engineering team