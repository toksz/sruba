# Error Patterns

## Error Recovery
```typescript
class ErrorRecoveryStrategy implements RecoveryStrategy {
	canHandle(error: AgentError): boolean {
		return error.type === ErrorType.SPECIFIC_ERROR;
	}
	async handle(error: AgentError): Promise<void> {
		ErrorLogger.log(error);
		await this.applyFix(error);
	}
}
```

## Error Logging
```typescript
ErrorLogger.log(error, {
	severity: error.severity,
	agent: error.agent,
	context: error.context
});
```