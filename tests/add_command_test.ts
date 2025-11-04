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

/**
 * Test: Reading from stdin with plain text
 */
Deno.test("add command - stdin with plain text creates task", async () => {
  setOptions({ apiToken: "test-token", quiet: true });

  const exit = mockExit();
  const cons = mockConsole();

  let calledEndpoint: string | null = null;
  let calledBody: string | null = null;
  let calledContentType: string | null = null;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url: string | URL | Request, init?: RequestInit) => {
    calledEndpoint = url.toString();
    calledBody = init?.body as string || "";
    calledContentType = (init?.headers as Record<string, string>)?.["Content-Type"] || null;
    return new Response(JSON.stringify({ _id: "task789" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };

  // Mock stdin
  const originalStdin = Deno.stdin;
  const stdinContent = "Task from stdin +today";
  const encoder = new TextEncoder();
  const stdinData = encoder.encode(stdinContent);
  let readCount = 0;

  (Deno as any).stdin = {
    read: async (buffer: Uint8Array) => {
      if (readCount === 0) {
        buffer.set(stdinData);
        readCount++;
        return stdinData.length;
      }
      return null; // EOF
    }
  };

  try {
    await add([], { file: "-" });
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
  }

  // Verify the endpoint was called correctly
  assertStringIncludes(calledEndpoint || "", "/api/addTask");
  assertEquals(calledBody, stdinContent);
  assertEquals(calledContentType, "text/plain");

  exit.restore();
  cons.restore();
  globalThis.fetch = originalFetch;
  (Deno as any).stdin = originalStdin;
});

/**
 * Test: Reading JSON from stdin
 */
Deno.test("add command - stdin with JSON creates task", async () => {
  setOptions({ apiToken: "test-token", quiet: true });

  const exit = mockExit();
  const cons = mockConsole();

  let calledEndpoint: string | null = null;
  let calledBody: string | null = null;
  let calledContentType: string | null = null;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url: string | URL | Request, init?: RequestInit) => {
    calledEndpoint = url.toString();
    calledBody = init?.body as string || "";
    calledContentType = (init?.headers as Record<string, string>)?.["Content-Type"] || null;
    return new Response(JSON.stringify({ _id: "task999" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };

  // Mock stdin with JSON
  const originalStdin = Deno.stdin;
  const stdinContent = '{"db":"Tasks","title":"JSON task","done":false}';
  const encoder = new TextEncoder();
  const stdinData = encoder.encode(stdinContent);
  let readCount = 0;

  (Deno as any).stdin = {
    read: async (buffer: Uint8Array) => {
      if (readCount === 0) {
        buffer.set(stdinData);
        readCount++;
        return stdinData.length;
      }
      return null; // EOF
    }
  };

  try {
    await add([], { file: "-" });
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
  }

  // Verify JSON was detected and sent correctly
  assertStringIncludes(calledEndpoint || "", "/api/addTask");
  assertEquals(calledBody, stdinContent);
  assertEquals(calledContentType, "application/json");

  exit.restore();
  cons.restore();
  globalThis.fetch = originalFetch;
  (Deno as any).stdin = originalStdin;
});

/**
 * Test: Empty stdin shows error
 */
Deno.test("add command - empty stdin shows error", async () => {
  setOptions({ apiToken: "test-token", quiet: true });

  const exit = mockExit();
  const cons = mockConsole();

  const originalStdin = Deno.stdin;
  (Deno as any).stdin = {
    read: async (buffer: Uint8Array) => {
      return null; // Immediate EOF (empty stdin)
    }
  };

  try {
    await add([], { file: "-" });
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
  }

  assertEquals(exit.exitCode, 1);
  assertStringIncludes(cons.stderr, "Stdin was empty");

  exit.restore();
  cons.restore();
  (Deno as any).stdin = originalStdin;
});
