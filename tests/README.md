# marvin-cli Tests

This directory contains automated tests for marvin-cli using Deno's built-in test framework.

## Running Tests

```bash
# Run all tests (requires --allow-read for command tests)
deno test --allow-read tests/

# Run with verbose output
deno test --allow-read tests/

# Run a specific test file
deno test tests/error_handling_test.ts  # No permissions needed
deno test --allow-read tests/commands_test.ts  # Requires file read access

# Generate coverage report
deno test --allow-read --coverage=coverage/ tests/
deno coverage coverage/
```

**Note:** Command tests require `--allow-read` permission because they read source files to verify help text without importing (which avoids localStorage initialization side effects).

## Test Files

### `error_handling_test.ts`
Tests for TypeScript error handling type safety. Verifies that the codebase properly narrows `unknown` error types before accessing properties like `.message`.

**What it tests:**
- Error instances are handled correctly
- Non-Error values (strings, objects, null, undefined) are converted safely
- Type narrowing pattern works consistently across the codebase

### `commands_test.ts`
Tests for command implementation logic, argument parsing, and validation patterns. Tests logic without making actual API calls or importing command functions (which have side effects).

**What it tests:**
- Help text is exported and contains required information
- Command parameter validation patterns (empty, single, multiple params)
- File type detection (JSON vs plain text)
- Content-Type determination logic
- API endpoint selection based on document type
- Command variation detection (task vs project, implicit vs explicit)
- Options object structure and flags
- Global option flags (output formats, target selection)

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

- `error_handling_test.ts` - Type safety and error handling tests (5 tests)
- `commands_test.ts` - Command logic, argument parsing, validation (20 tests)
- (Future) `api_call_test.ts` - API request/response handling
- (Future) `localStorage_test.ts` - Local storage operations
- (Future) `jsonl_output_test.ts` - JSONL output format (Phase 1)

## Continuous Integration

Tests will run automatically on:
- Pull request creation
- Pushes to main branch
- (Future) Before releases

All tests must pass before code can be merged.
