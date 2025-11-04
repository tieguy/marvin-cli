/**
 * Integration tests for add command
 *
 * These tests verify the actual add command behavior. Note that testing code
 * with Deno.exit() is inherently challenging - we focus on testing error paths
 * and command parsing logic that we can reliably verify.
 *
 * For successful API call paths, manual testing is more reliable than mocking
 * all the Deno APIs.
 */

import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.184.0/testing/asserts.ts";
import add from "../src/commands/add.ts";
import { setOptions } from "../src/options.ts";

/**
 * Helper to capture Deno.exit() calls
 */
class ExitError extends Error {
  constructor(public code: number) {
    super(`EXIT_${code}`);
    this.name = "ExitError";
  }
}

function mockExit(): { exitCode: number | null; restore: () => void } {
  const original = Deno.exit;
  const state = { exitCode: null as number | null };

  Deno.exit = ((code?: number) => {
    state.exitCode = code ?? 0;
    throw new ExitError(code ?? 0);
  }) as typeof Deno.exit;

  return {
    get exitCode() { return state.exitCode; },
    restore() { Deno.exit = original; }
  };
}

/**
 * Helper to capture console output
 */
function mockConsole() {
  const original = { log: console.log, error: console.error };
  const output = { stdout: [] as string[], stderr: [] as string[] };

  console.log = (...args: unknown[]) => {
    output.stdout.push(args.map(String).join(" "));
  };

  console.error = (...args: unknown[]) => {
    output.stderr.push(args.map(String).join(" "));
  };

  return {
    get stdout() { return output.stdout.join("\n"); },
    get stderr() { return output.stderr.join("\n"); },
    restore() {
      console.log = original.log;
      console.error = original.error;
    }
  };
}

/**
 * Test: Help flag displays help
 */
Deno.test("add command - help flag displays help and exits 0", async () => {
  const exit = mockExit();
  const cons = mockConsole();

  try {
    await add([], { help: true });
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
  }

  assertEquals(exit.exitCode, 0);
  assertStringIncludes(cons.stdout, "marvin add");
  assertStringIncludes(cons.stdout, "EXAMPLE:");

  exit.restore();
  cons.restore();
});

/**
 * Test: Error when no parameters provided
 */
Deno.test("add command - no parameters shows error", async () => {
  const exit = mockExit();
  const cons = mockConsole();

  try {
    await add([], {});
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
  }

  assertEquals(exit.exitCode, 1);
  assertStringIncludes(cons.stderr, "marvin add");

  exit.restore();
  cons.restore();
});

/**
 * Test: Error when "task" provided without title
 */
Deno.test("add command - 'task' without title shows error", async () => {
  const exit = mockExit();
  const cons = mockConsole();

  try {
    await add(["task"], {});
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
  }

  assertEquals(exit.exitCode, 1);
  assertStringIncludes(cons.stderr, "Missing task title");

  exit.restore();
  cons.restore();
});

/**
 * Test: Error when "project" provided without title
 */
Deno.test("add command - 'project' without title shows error", async () => {
  const exit = mockExit();
  const cons = mockConsole();

  try {
    await add(["project"], {});
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
  }

  assertEquals(exit.exitCode, 1);
  assertStringIncludes(cons.stderr, "Missing project title");

  exit.restore();
  cons.restore();
});

/**
 * Test: API error is handled correctly
 */
Deno.test("add command - API error exits with code 1", async () => {
  setOptions({ apiToken: "test-token", quiet: true });

  const exit = mockExit();
  const cons = mockConsole();

  // Mock fetch to return an error
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return new Response("Task not found", { status: 404 });
  };

  try {
    await add(["Buy groceries"], {});
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
  }

  assertEquals(exit.exitCode, 1);
  assertStringIncludes(cons.stderr, "404");

  exit.restore();
  cons.restore();
  globalThis.fetch = originalFetch;
});

/**
 * Test: Verify API endpoint routing for task
 *
 * This test verifies that tasks are sent to the correct endpoint.
 * Note: Due to the challenges of mocking Deno.exit() in try-catch blocks,
 * we can only reliably test that the endpoint is called, not the full success path.
 */
Deno.test("add command - task calls /api/addTask endpoint", async () => {
  setOptions({ apiToken: "test-token", quiet: true });

  const exit = mockExit();
  const cons = mockConsole();

  let calledEndpoint: string | null = null;
  let calledBody: string | null = null;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url: string | URL | Request, init?: RequestInit) => {
    calledEndpoint = url.toString();
    calledBody = init?.body as string || "";
    return new Response(JSON.stringify({ _id: "task123" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };

  try {
    await add(["Buy groceries"], {});
  } catch (e) {
    // Will throw due to exit mock
    if (!(e instanceof ExitError)) throw e;
  }

  // Verify the endpoint was called correctly
  assertStringIncludes(calledEndpoint || "", "/api/addTask");
  assertEquals(calledBody, "Buy groceries");

  exit.restore();
  cons.restore();
  globalThis.fetch = originalFetch;
});

/**
 * Test: Verify API endpoint routing for project
 */
Deno.test("add command - project calls /api/addProject endpoint", async () => {
  setOptions({ apiToken: "test-token", quiet: true });

  const exit = mockExit();
  const cons = mockConsole();

  let calledEndpoint: string | null = null;
  let calledBody: string | null = null;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url: string | URL | Request, init?: RequestInit) => {
    calledEndpoint = url.toString();
    calledBody = init?.body as string || "";
    return new Response(JSON.stringify({ _id: "proj123" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };

  try {
    await add(["project", "Q1 Planning"], {});
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
  }

  // Verify the endpoint was called correctly
  assertStringIncludes(calledEndpoint || "", "/api/addProject");
  assertEquals(calledBody, "Q1 Planning");

  exit.restore();
  cons.restore();
  globalThis.fetch = originalFetch;
});
