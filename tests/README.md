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
Integration and behavioral tests for command implementations. Tests verify actual behavior including file operations and critical logic patterns.

**What it tests:**
- **Help text verification** - Reads source files to verify help text exports exist (4 tests)
- **Parameter validation patterns** - Verifies command argument parsing (3 tests)
- **File-based integration test** - Creates temp files to test JSON detection workflow (1 test)
- **JSON detection logic** - Tests the actual algorithm from add.ts for detecting JSON files (3 tests)
- **Endpoint routing** - Verifies task vs project API endpoint selection (2 tests)

**Why these tests matter:**
- Help text tests catch missing/broken documentation
- Integration test demonstrates temp file handling and real I/O
- JSON detection tests would catch bugs like changing `{` to `[` in the detection logic
- Endpoint routing tests prevent tasks being sent to project API (data corruption)

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
- `commands_test.ts` - Integration and behavioral tests for commands (13 tests)
- (Future) `api_call_test.ts` - API request/response handling with mocks
- (Future) `localStorage_test.ts` - Local storage operations
- (Future) `jsonl_output_test.ts` - JSONL output format (Phase 1)

**Total: 18 passing tests**

## Continuous Integration

Tests will run automatically on:
- Pull request creation
- Pushes to main branch
- (Future) Before releases

All tests must pass before code can be merged.
