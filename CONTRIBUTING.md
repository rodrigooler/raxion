# Contributing to RAXION

Thank you for your interest in contributing to RAXION! This document provides guidelines and instructions for contributing.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [License](#license)

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md). Please read it before contributing.

---

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your contribution
4. Make your changes
5. Submit a pull request

---

## Development Setup

### Prerequisites

- Rust 1.75+ (for core protocol)
- Node.js 20+ (for tooling)
- Solana CLI tools
- Anchor CLI (for Solana programs)

### Building

```bash
# Clone the repository
git clone https://github.com/rodrigooler/raxion.git
cd raxion

# Build core (Rust)
cargo build

# Run tests
cargo test

# Build Solana programs
anchor build
```

---

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Rust version, etc.)

### Suggesting Features

Open an issue with the `enhancement` label describing:

- The feature you'd like to see
- Why it would be useful
- Any implementation ideas

### Contributing Code

1. Find an open issue or create one to discuss your proposed changes
2. Fork the repository and create a branch from `main`
3. Make your changes following our coding standards
4. Write tests for new functionality
5. Submit a pull request

---

## Pull Request Process

1. **Create a descriptive PR title** following conventional commits
2. **Link related issues** in the PR description
3. **Ensure all tests pass** before requesting review
4. **Update documentation** if needed
5. **Request review** from maintainers

### PR Checklist

- [ ] Code compiles without warnings
- [ ] All tests pass
- [ ] New code has test coverage
- [ ] Documentation is updated
- [ ] Commit messages follow guidelines
- [ ] PR title follows conventional commits

---

## Coding Standards

### Rust

- Follow [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- Use `cargo fmt` before committing
- Use `cargo clippy` and fix all warnings
- Document public APIs with doc comments

### General

- Write clear, self-documenting code
- Keep functions focused and small
- Use meaningful variable names
- Add comments for complex logic

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(neural-svm): add parallel cognition scheduler
fix(zk-ml): resolve proof verification edge case
docs(whitepaper): update chapter 3 with new specifications
test(cross-validation): add convergence test cases
```

---

## License

By contributing to RAXION, you agree that your contributions will be licensed under the [Business Source License 1.1](./LICENSE).

---

## Questions?

- Open an issue for questions about contributing

Thank you for helping make RAXION better!
