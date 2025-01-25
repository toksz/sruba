# Contributing to Sruba

Welcome! Thank you for your interest in contributing to Sruba, a fork of the [bolt.diy](https://github.com/stackblitz-labs/bolt.diy) project. This guide will help you get started with contributing to our project. 💡

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Making Changes](#making-changes)
5. [Testing](#testing)
6. [Submitting Changes](#submitting-changes)
7. [Contact](#contact)

## 🤝 Code of Conduct

We are committed to providing a welcoming and inclusive environment. All contributors are expected to uphold our Code of Conduct:

- Be respectful and inclusive
- Exercise empathy and kindness
- Give and gracefully accept constructive feedback
- Focus on what is best for the community

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/sruba.git
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/toksz/sruba.git
   ```

## 💻 Development Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Configure your environment variables in `.env.local`

4. Start development server:
   ```bash
   pnpm dev
   ```

## 🛠️ Making Changes

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our coding standards:
   - Use TypeScript strict mode
   - Follow ESLint rules
   - Use Prettier for formatting
   - Add appropriate tests
   - Update documentation as needed

3. Commit your changes:
   ```bash
   git commit -m "feat: add your feature description"
   ```

## 🧪 Testing

1. Run tests:
   ```bash
   pnpm test
   ```

2. Ensure all tests pass and add new tests for new features

## 📤 Submitting Changes

1. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Create a Pull Request:
   - Use a clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - Ensure all checks pass

## 📞 Contact

- GitHub Issues: For bug reports and feature requests
- Discord: Contact @toakz for questions or discussions
- Project Discussions: For general topics and ideas

## 🙏 Attribution

This project is based on [bolt.diy](https://github.com/stackblitz-labs/bolt.diy). We extend our gratitude to the bolt.diy team for their excellent work that serves as the foundation for Sruba.