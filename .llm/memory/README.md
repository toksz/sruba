# LLM Memory Directory

This directory contains persistent memories that help LLMs maintain context across conversations and interactions with the codebase.

## Structure

### 1. System Memories
- `system/` - Core system knowledge
  - Architecture patterns
  - Common workflows
  - Error patterns
  - Performance considerations

### 2. User Preferences
- `user/` - User-specific preferences
  - Coding style
  - Documentation preferences
  - Testing approaches
  - Error handling preferences

### 3. Project State
- `state/` - Current project state
  - Active development areas
  - Known issues
  - Recent changes
  - Upcoming tasks

### 4. Learning
- `learning/` - Accumulated knowledge
  - Successful patterns
  - Failed approaches
  - Optimization opportunities
  - Common pitfalls

## Usage Guidelines

1. **Memory Creation**
   - Create focused, atomic memories
   - Include relevant context
   - Tag for easy retrieval
   - Version if needed

2. **Memory Updates**
   - Update when patterns change
   - Maintain history of changes
   - Document update reasoning
   - Validate updates

3. **Memory Retrieval**
   - Use appropriate tags
   - Consider context
   - Verify relevance
   - Check freshness

4. **Memory Cleanup**
   - Archive obsolete memories
   - Update outdated information
   - Remove duplicates
   - Maintain organization
