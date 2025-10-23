# marvin-cli Tests

This directory contains automated tests for marvin-cli using Deno's built-in test framework.

## Running Tests

```bash
# Run all tests
deno test tests/

# Run with verbose output
deno test --allow-all tests/

# Run a specific test file
deno test tests/error_handling_test.ts

# Generate coverage report
deno test --coverage=coverage/ tests/
deno coverage coverage/
```

## Test Files

### `error_handling_test.ts`
Tests for TypeScript error handling type safety. Verifies that the codebase properly narrows `unknown` error types before accessing properties like `.message`.

**What it tests:**
- Error instances are handled correctly
- Non-Error values (strings, objects, null, undefined) are converted safely
- Type narrowing pattern works consistently across the codebase

## Writing New Tests

When adding new functionality to marvin-cli, add corresponding tests:

1. Create a new test file: `tests/feature_name_test.ts`
2. Import Deno testing utilities:
   ```typescript
   import { assertEquals, assertThrows } from "https://deno.land/std@0.184.0/testing/asserts.ts";
   ```
3. Write tests using `Deno.test()`:
   ```typescript
   Deno.test("Feature - specific behavior", () => {
     // Your test code
   });
   ```

## Mocking

For tests that would normally call the Marvin API:
- Mock the API responses using stub functions
- Don't make real API calls in automated tests
- Consider adding manual integration tests in a separate directory

## Test Organization

- `error_handling_test.ts` - Type safety and error handling tests
- (Future) `api_call_test.ts` - API request/response handling
- (Future) `commands_test.ts` - CLI command parsing and execution
- (Future) `localStorage_test.ts` - Local storage operations

## Continuous Integration

Tests will run automatically on:
- Pull request creation
- Pushes to main branch
- (Future) Before releases

All tests must pass before code can be merged.
