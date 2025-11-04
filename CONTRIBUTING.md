# Contributing to marvin-cli

Thank you for your interest in contributing to marvin-cli! This guide will help you set up your development environment and understand our testing practices.

## Development Setup

### Prerequisites

- [Deno](https://deno.land/) 2.x or later
- Git
- An Amazing Marvin account with API credentials (for integration testing)

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/marvin-cli.git
   cd marvin-cli
   ```

3. Build the project:
   ```bash
   ./build
   ```

4. Configure your API credentials (optional, for manual testing):
   ```bash
   ./marvin-cli config apiToken YOUR_API_TOKEN
   ```

## Testing

We use Deno's built-in test framework. Tests are located in the `tests/` directory.

### Running Tests

```bash
# Run all tests
deno test tests/

# Run a specific test file
deno test tests/error_handling_test.ts

# Run tests with coverage
deno test --coverage=coverage/ tests/
deno coverage coverage/
```

### Writing Tests

Tests should be written in TypeScript and placed in the `tests/` directory. Use descriptive test names that explain what behavior is being verified.

**Example test structure:**

```typescript
import { assertEquals } from "https://deno.land/std@0.184.0/testing/asserts.ts";

Deno.test("Feature name - specific behavior", () => {
  // Arrange
  const input = "test";

  // Act
  const result = someFunction(input);

  // Assert
  assertEquals(result, expectedValue);
});
```

### Test Guidelines

1. **Unit Tests**: Test individual functions in isolation
2. **Mock External Dependencies**: Don't make real API calls in tests
3. **Descriptive Names**: Test names should describe the behavior being tested
4. **One Assertion Per Test**: Keep tests focused and easy to debug
5. **Cover Edge Cases**: Test error conditions, null values, boundary cases

### Type Safety

This project uses strict TypeScript type checking. All code must:

- Pass `deno check` without errors
- Properly narrow `unknown` types in error handling:
  ```typescript
  try {
    // code
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
  }
  ```

## Code Style

- Use TypeScript for all source files
- Follow existing code formatting patterns
- Add comments for complex logic
- Keep functions focused and small

## Pull Request Process

1. **Create a feature branch** from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the guidelines above

3. **Write tests** for new functionality

4. **Ensure all tests pass**:
   ```bash
   deno test tests/
   ./build  # Verify build succeeds
   ```

5. **Commit your changes** with a clear commit message:
   ```bash
   git commit -m "Add feature: brief description

   Longer explanation of what changed and why."
   ```

6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request** on GitHub with:
   - Clear description of what changed
   - Why the change is needed
   - How to test it
   - Any relevant issue numbers

## Project Structure

```
marvin-cli/
├── src/                    # Source code
│   ├── index.ts           # Main entry point
│   ├── apiCall.ts         # API request handling
│   ├── commands/          # Command implementations
│   ├── localStorage.ts    # Local storage utilities
│   ├── options.ts         # CLI options parsing
│   └── types.ts           # TypeScript type definitions
├── tests/                 # Test files
│   └── error_handling_test.ts
├── build                  # Build script
├── marvin                 # Shell wrapper for CLI
├── README.md              # User documentation
└── CONTRIBUTING.md        # This file
```

## Getting Help

- **Issues**: Search existing [issues](https://github.com/amazingmarvin/marvin-cli/issues) or open a new one
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Amazing Marvin**: See the [official documentation](https://help.amazingmarvin.com/)

## Code of Conduct

Be respectful, constructive, and collaborative. We're all here to make marvin-cli better!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
