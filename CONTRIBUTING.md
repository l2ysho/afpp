# Contributing to afpp

Thank you for your interest in contributing to afpp. Contributions are welcome, whether they are bug reports, feature proposals, documentation improvements, or code changes.

This document outlines the expected workflow and standards to keep the project maintainable and predictable.

---

## Scope & Philosophy

afpp is intentionally focused and minimal.

Before proposing changes, please consider:

- Does this align with the goal of a dependency-light, Node-first PDF parser?
- Does this avoid introducing native build steps or heavy transitive dependencies?
- Does this preserve performance, memory characteristics, and API clarity?

Large or architectural changes should be discussed via an issue before implementation.

---

## Development Environment

### Requirements

- Node.js >= 22.14.0
- npm, Yarn, or pnpm

### Install Dependencies

```sh
npm install
```

---

## Running the Project

### Tests

Run the full test suite:

```sh
npm test
```

If tests fail locally, please do not open a pull request until they pass.

### Coverage

Coverage is collected automatically in CI. Local coverage may be generated if needed:

```sh
npm run test:coverage
```

### Mutation Testing

Coverage shows which lines run, not whether a test would notice if they broke.
[Stryker](https://stryker-mutator.io) answers the second question: it changes the
source in small ways (a `>` becomes `>=`, a `true` becomes `false`) and checks if
a test fails. A mutant that survives points at a weak or missing assertion.

```sh
npm run test:mutation
```

The run takes a few minutes and writes a report to `reports/mutation/index.html`.
Every pull request runs it too; the score is in the job summary and the full
report is attached as the `mutation-report` artifact.

Survived mutants are a hint, not a rule. Some are equivalent mutants, which no
test can kill. Read the report before you change a test.

---

## Code Style & Conventions

- The project is written in TypeScript
- Prefer explicit types over implicit `any`
- Avoid side effects in shared modules
- Keep functions small and single-purpose
- Public APIs must remain backward compatible unless a breaking change is justified

Formatting and linting are enforced automatically.

---

## Commits & Pull Requests

### Commit Messages

- Use clear, descriptive commit messages
- Prefer conventional commits where applicable:
  - `feat:` new functionality
  - `fix:` bug fixes
  - `docs:` documentation only changes
  - `refactor:` non-breaking internal changes

### Pull Requests

- Keep PRs focused and minimal
- Include tests for bug fixes or new functionality
- Update documentation if public behavior changes
- Reference related issues where applicable

Pull requests that significantly increase bundle size, add native dependencies, or weaken error handling are unlikely to be accepted.

---

## Reporting Issues

When opening an issue, please include:

- Node.js version
- Operating system
- Input type (path / buffer / URL)
- Whether the PDF is encrypted
- A minimal reproducible example, if possible

Do not include sensitive or proprietary PDFs.

---

## Security Issues

Please do not report security vulnerabilities publicly.

Instead, follow the instructions in [SECURITY.md](./SECURITY.md).

---

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.
