# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2025-01-25

### Added
- Initial project setup with TypeScript and Node.js
- Core agent system implementation
  - BaseAgent abstract class with core functionality
  - AgentManager for managing multiple agents
  - Event system for inter-agent communication
- Testing infrastructure
  - Vitest setup with EventEmitter mocking
  - Test suite for event system
- Basic project documentation
  - README.md with setup instructions
  - .env.example for configuration
  - Project structure documentation
- Attribution and credits to [bolt.diy](https://github.com/stackblitz-labs/bolt.diy) project

### Changed
- N/A (Initial Release)

### Deprecated
- N/A (Initial Release)

### Removed
- N/A (Initial Release)

### Fixed
- N/A (Initial Release)

### Security
- Environment variables properly handled through .env
- Sensitive files excluded in .gitignore
