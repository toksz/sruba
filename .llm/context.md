# Sruba Project Context

## Overview
Sruba is a multi-agent system designed to enhance development workflows through intelligent collaboration between specialized AI agents. The system is built with TypeScript and follows event-driven architecture principles.

## Core Components

### Agent System
- Base agent infrastructure in `app/lib/agents/core/`
- Event-driven communication
- State management with context awareness
- Error handling and recovery strategies

### Key Design Principles
1. **Modularity**: Each agent is independent and specialized
2. **Event-Driven**: Asynchronous communication via event bus
3. **Type Safety**: Comprehensive TypeScript types
4. **Error Resilience**: Structured error handling and recovery

## Development Guidelines

### Code Organization
- Core agent logic in `app/lib/agents/core/`
- Type definitions in `types/`
- Tests in `__tests__/` directories
- Documentation in `docs/` and `.llm/`

### Error Handling Protocol
1. Use typed errors from `errors/error-types.ts`
2. Implement recovery strategies
3. Log errors with context
4. Break down complex errors into manageable units

### State Management
1. Use immutable state patterns
2. Track state changes through events
3. Maintain context separation
4. Implement persistence where needed

### Testing Strategy
1. Unit tests for core components
2. Integration tests for agent interactions
3. Error scenario testing
4. Performance benchmarks

## LLM Interaction Notes

### File Organization
- Check `.llm/patterns.md` for common code patterns
- Review `.llm/decisions.md` for architecture decisions
- Follow `.llm/roadmap.md` for development direction

### Error Resolution
1. Analyze error type and context
2. Break down complex errors
3. Generate targeted fixes
4. Update documentation if needed

### Code Quality
1. Verify type safety
2. Check test coverage
3. Validate documentation
4. Ensure code style compliance
