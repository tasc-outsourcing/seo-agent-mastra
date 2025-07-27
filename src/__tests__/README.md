# Test Suite Documentation

## Overview

This test suite provides comprehensive coverage for the TASC Blog Article Agent v2 project, focusing on SEO functionality, agent behavior, and workflow execution.

## Test Structure

```
src/
├── __tests__/
│   └── README.md (this file)
├── lib/
│   └── seo-analyzer/
│       ├── __tests__/
│       │   ├── seo-analyzer.test.ts      # Core SEO analyzer tests
│       │   └── assessments.test.ts       # Individual assessment tests
│       └── scoring/
│           └── __tests__/
│               └── advanced-scorer.test.ts # Advanced scoring algorithm tests
└── mastra/
    ├── agents/
    │   └── __tests__/
    │       ├── blog-article.test.ts      # Blog article agent tests
    │       └── seo-agents.test.ts        # SEO specialist agent tests
    ├── tools/
    │   └── __tests__/
    │       └── unified-research.test.ts   # Unified research tool tests
    └── workflows/
        └── __tests__/
            └── seo-article-workflow.test.ts # SEO workflow tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

## Test Categories

### 1. SEO Analyzer Tests (`seo-analyzer.test.ts`)

Tests the core SEO analysis functionality:
- Basic content analysis
- SEO scoring calculations
- Readability assessments
- Advanced analysis with E-A-T scores
- Optimization suggestions

### 2. SEO Assessments Tests (`assessments.test.ts`)

Tests individual SEO assessment algorithms:
- Semantic keyword analysis
- Heading structure validation
- Content freshness detection
- External link quality assessment

### 3. Advanced Scoring Tests (`advanced-scorer.test.ts`)

Tests the weighted scoring system:
- Weighted assessment calculations
- Content quality scoring
- E-A-T (Expertise, Authoritativeness, Trustworthiness) scoring
- Recommendation generation and prioritization

### 4. Agent Tests

#### Blog Article Agent (`blog-article.test.ts`)
- Agent configuration validation
- Tool access verification
- Instruction completeness

#### SEO Agents (`seo-agents.test.ts`)
- Configuration for all 5 SEO specialist agents
- Tool assignments
- Phase-specific instructions

### 5. Tool Tests (`unified-research.test.ts`)

Tests the unified research tool:
- Mode switching (basic, web, deep)
- Caching functionality
- Error handling
- Input validation

### 6. Workflow Tests (`seo-article-workflow.test.ts`)

Tests the 15-phase SEO article workflow:
- Step definitions
- Agent invocation
- Data flow between phases
- Error handling

## Key Testing Patterns

### Custom Matchers

```typescript
// Custom SEO score validator
expect(score).toBeValidSEOScore(); // 0-100
```

### Mock Patterns

```typescript
// Mock Mastra agents
jest.mock('../../index', () => ({
  mastra: {
    getAgent: jest.fn()
  }
}));

// Mock research functions
jest.mock('../basic-research', () => ({
  performBasicResearch: jest.fn()
}));
```

### Test Data Factories

```typescript
const createAssessment = (id: string, score: number, rating: string): AssessmentResult => ({
  id,
  score: score as any,
  rating: rating as any,
  text: `Assessment for ${id}`
});
```

## Coverage Goals

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Best Practices

1. **Isolation**: Each test should be independent and not rely on external services
2. **Mocking**: Mock external dependencies (APIs, databases, file system)
3. **Clarity**: Use descriptive test names that explain what is being tested
4. **Coverage**: Aim for high coverage but focus on meaningful tests
5. **Performance**: Keep tests fast by avoiding unnecessary operations

## Adding New Tests

When adding new features:

1. Create test files following the naming convention: `*.test.ts`
2. Place tests near the code they test in `__tests__` directories
3. Use the existing test patterns and utilities
4. Update this README if adding new test categories

## Debugging Tests

```bash
# Run a specific test file
npm test src/lib/seo-analyzer/__tests__/seo-analyzer.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="should analyze content"

# Run with verbose output
npm test -- --verbose
```

## CI/CD Integration

The test suite is designed to run in CI/CD pipelines:
- Fast execution (mocked external dependencies)
- Consistent results (no randomness)
- Clear failure messages
- Coverage reporting