# 🚀 AgriAI Development Guidelines

## 📋 Overview
Questo documento definisce le linee guida di sviluppo per il progetto AgriAI, garantendo qualità del codice, consistenza e best practices.

## 🔧 Setup Iniziale

### Prerequisiti
- Node.js 18+
- npm 9+
- Git 2.40+

### Installazione
```bash
# Clone del repository
git clone <repository-url>
cd agriai-groks-garden

# Installazione dipendenze
npm install

# Setup environment
cp .env.example .env
# Configurare le variabili d'ambiente

# Setup database
npm run db:migrate:dev
npm run db:seed

# Verificare setup
npm run quality:check
npm run test
```

## 📝 Coding Standards

### TypeScript
- **Strict mode abilitato**: No `any`, uso di tipi espliciti
- **Naming conventions**: 
  - `camelCase` per variabili e funzioni
  - `PascalCase` per tipi e classi
  - `UPPER_CASE` per costanti
- **File naming**: `kebab-case.ts`

### Code Organization
```
src/
├── components/          # React components
├── controllers/         # API controllers
├── services/           # Business logic
├── middleware/         # Express/Fastify middleware
├── lib/               # Utility libraries
├── types/             # TypeScript type definitions
├── tests/             # Test files
└── config/            # Configuration files
```

### Best Practices
- **Funzioni piccole**: Massimo 50 righe
- **Complessità ridotta**: Massimo 10 di complessità ciclomatica
- **Documentation**: JSDoc per funzioni pubbliche
- **Error handling**: Sempre gestire errori esplicitamente
- **No console.log**: Usare logger strutturato

## 🧪 Testing Standards

### Coverage Requirements
- **Unit tests**: ≥ 90% coverage
- **Integration tests**: ≥ 80% coverage
- **E2E tests**: Copertura dei flussi critici

### Testing Patterns
```typescript
// Test structure
describe('ServiceName', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  describe('methodName', () => {
    it('should handle successful case', () => {
      // Arrange
      // Act  
      // Assert
    });

    it('should handle error case', () => {
      // Test error scenarios
    });
  });
});
```

### Test Commands
```bash
# Unit tests
npm run test:unit

# Integration tests  
npm run test:integration

# Coverage report
npm run test:coverage

# Watch mode
npm run test:watch
```

## 🔍 Quality Gates

### Pre-commit Hooks
I seguenti controlli vengono eseguiti automaticamente:
- **Linting**: ESLint con fix automatico
- **Formatting**: Prettier con fix automatico
- **Type checking**: TypeScript compilation
- **Tests**: Test relativi ai file modificati

### CI/CD Pipeline
Ogni PR deve passare:
1. **Quality checks**: Lint, format, type-check
2. **Security scan**: Vulnerabilità e dipendenze
3. **Test suite**: Unit e integration tests
4. **Build verification**: Build successful
5. **Coverage validation**: Soglie rispettate

## 📋 Pull Request Process

### 1. Branch Strategy
```bash
# Feature branch
git checkout -b feat/feature-name

# Bug fix branch  
git checkout -b fix/bug-description

# Hotfix branch
git checkout -b hotfix/critical-fix
```

### 2. Commit Convention
```bash
# Format
type(scope): description

# Examples
feat(auth): add JWT token validation
fix(api): resolve CORS configuration issue
docs(readme): update installation guide
test(users): add integration tests for user service
```

### 3. PR Checklist
- [ ] **Branch updated** con latest main/develop
- [ ] **Tests passed** localmente
- [ ] **Coverage maintained** secondo standard
- [ ] **Documentation updated** se necessario
- [ ] **Breaking changes** documentati
- [ ] **Self-review** completato

### 4. Review Requirements
- **2 approvals** obbligatori
- **All conversations resolved**
- **CI/CD green**
- **No merge conflicts**

## 🛡️ Security Guidelines

### Authentication & Authorization
- **JWT tokens** con scadenza appropriata
- **Rate limiting** su tutti gli endpoint
- **Input validation** sempre attiva
- **SQL injection prevention**

### Code Security
- **No hardcoded secrets**
- **Environment variables** per configurazioni
- **Dependency scanning** automatico
- **HTTPS only** in produzione

### API Security
```typescript
// Input validation
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

// Rate limiting
{
  config: {
    rateLimit: {
      max: 10,
      timeWindow: '1 minute'
    }
  }
}
```

## 🚀 Performance Guidelines

### Frontend Performance
- **Lazy loading** per components
- **Memoization** per expensive operations
- **Bundle optimization** con tree shaking
- **Image optimization**

### Backend Performance
- **Database indexing** appropriato
- **Query optimization** 
- **Caching strategies** con Redis
- **Connection pooling**

### Monitoring
```bash
# Performance profiling
npm run profile

# Bundle analysis
npm run analyze

# Performance tests
npm run test:performance
```

## 📚 Documentation Standards

### Code Documentation
```typescript
/**
 * Authenticate user with email and password
 * 
 * @param credentials - User login credentials
 * @param options - Additional authentication options
 * @returns Promise<AuthResult> Authentication result
 * @throws {AuthenticationError} When credentials are invalid
 * 
 * @example
 * ```typescript
 * const result = await authService.login({
 *   email: 'user@example.com',
 *   password: 'password123'
 * });
 * ```
 */
async login(credentials: LoginCredentials, options?: AuthOptions): Promise<AuthResult>
```

### API Documentation
- **OpenAPI 3.0** specs complete
- **Examples** per ogni endpoint
- **Error codes** documentati
- **Authentication** flow spiegato

### README Updates
- **Installation** steps aggiornate
- **Environment variables** documentate
- **Usage examples** forniti
- **Troubleshooting** section

## 🛠️ Tools e Commands

### Development
```bash
# Start development server
npm run dev

# Start backend server  
npm run dev:server

# Database operations
npm run db:migrate:dev
npm run db:studio
npm run db:seed
```

### Quality Assurance
```bash
# Full quality check
npm run quality:full

# Fix quality issues
npm run quality:fix

# Security audit
npm run security:audit
```

### Build & Deploy
```bash
# Production build
npm run build

# CI pipeline simulation
npm run ci:test

# Deploy preparation
npm run ci:deploy
```

## 📊 Metrics e Monitoring

### Quality Metrics
- **Code coverage**: Target 90%+
- **Build time**: < 5 minutes
- **Test execution**: < 10 minutes
- **Bundle size**: Monitored per regressioni

### Performance Metrics
- **API response time**: < 200ms p95
- **Database queries**: < 100ms p95
- **Memory usage**: Monitored per leak
- **Error rate**: < 1%

## 🆘 Troubleshooting

### Common Issues

#### Pre-commit Hook Failures
```bash
# Fix linting issues
npm run lint:fix

# Fix formatting
npm run format

# Type check errors
npm run type-check
```

#### Test Failures
```bash
# Run specific test
npm test -- --testNamePattern="test name"

# Debug test
npm test -- --verbose --detectOpenHandles

# Update snapshots
npm test -- --updateSnapshot
```

#### Build Issues
```bash
# Clear cache
npm run clean

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for type errors
npm run type-check
```

## 🔄 Continuous Improvement

### Review Process
- **Weekly**: Code quality metrics review
- **Monthly**: Process improvement discussion
- **Quarterly**: Tool and standard updates

### Feedback Loop
- **Developer surveys** per pain points
- **Metrics analysis** per ottimizzazioni
- **Best practices sharing** nel team
- **Training sessions** per nuovi tool

---

## 📞 Support

Per domande o supporto:
- **Technical Lead**: @senior-dev
- **DevOps Team**: @devops-team  
- **Documentation**: `docs/` directory
- **Issues**: GitHub Issues

**Remember**: Quality is everyone's responsibility! 🌟