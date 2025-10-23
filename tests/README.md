# marvin-cli Tests

This directory contains automated tests for marvin-cli using Deno's built-in test framework.

## Running Tests

```bash
# Run all tests
deno test tests/
```

## Test Files

### `add_command_test.ts`
Integration tests for the `add` command. Tests the actual decision-making logic extracted into a pure function.

**What it tests (12 tests):**
- Help flag handling
- Task creation (simple and explicit forms)
- Project creation
- JSON file detection and routing
- Plain text file handling
- Malformed JSON graceful degradation
- Error cases (empty files, missing parameters, missing titles)

**Why it's important:**
- **Tests marvin-cli behavior**, not JavaScript/Deno
- **Catches real bugs**: Proven to catch routing logic errors that would corrupt data
- **No side effects**: Tests pure decision logic without API calls or process exits
- **Comprehensive coverage**: 12 tests cover all major code paths in add command

**Example bugs it catches:**
- Reversing task/project routing logic
- Sending tasks to project API endpoint (data corruption)
- Sending projects to task API endpoint (data corruption)
- Breaking JSON detection
- Breaking file validation

## Testing Philosophy

**What makes a good test:**
1. **Tests actual code behavior** - Not JavaScript/Deno standard library
2. **Catches real bugs** - Demonstrated through mutation testing
3. **No side effects** - Tests pure functions when possible
4. **Clear failure messages** - Easy to understand what broke

**Refactoring for testability:**
The `add` command was refactored to extract core decision logic into `src/commands/add_testable.ts`:
- Pure function with no side effects
- Takes parameters, options, file content
- Returns decision object (action, endpoint, body, contentType)
- Original `add.ts` would call this, then execute the decision

This pattern allows testing without:
- Mocking Deno.exit()
- Mocking API calls
- Managing side effects

## Writing New Tests

When adding new functionality:

1. **Extract testable logic** into pure functions
2. **Write tests first** (TDD) to verify behavior
3. **Use mutation testing** to verify tests catch bugs
4. **Document** what the test catches and why it matters

Example test structure:
```typescript
Deno.test("feature - specific behavior", () => {
  const result = testableFunction(input);
  assertEquals(result.action, expectedAction);
  assertEquals(result.value, expectedValue);
});
```

## Future Tests

- (Phase 1) `jsonl_output_test.ts` - Tests for --jsonl flag
- Additional command tests following the add_testable.ts pattern
- API layer tests with proper mocking
