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
 * Helper to mock HTTP fetch with customizable response
 */
function mockFetch(options: {
  captureRequest?: boolean;
  response?: { status: number; body: unknown };
}) {
  const captured: {
    endpoint: string | null;
    body: string | null;
    method: string | null;
    contentType: string | null;
  } = {
    endpoint: null,
    body: null,
    method: null,
    contentType: null
  };

  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (url: string | URL | Request, init?: RequestInit) => {
    if (options.captureRequest) {
      captured.endpoint = url.toString();
      captured.body = init?.body as string || null;
      captured.method = init?.method || null;
      captured.contentType = (init?.headers as Record<string, string>)?.["Content-Type"] || null;
    }

    const responseBody = options.response?.body ?? { _id: "test123" };
    const responseStatus = options.response?.status ?? 200;

    return new Response(JSON.stringify(responseBody), {
      status: responseStatus,
      headers: { "Content-Type": "application/json" }
    });
  };

  return {
    get captured() { return captured; },
    restore() { globalThis.fetch = originalFetch; }
  };
}

/**
 * Helper to mock stdin with content
 */
function mockStdin(content: string) {
  const originalStdin = Deno.stdin;
  const encoder = new TextEncoder();
  const stdinData = encoder.encode(content);
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

  return {
    restore() { (Deno as any).stdin = originalStdin; }
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
  const fetch = mockFetch({ captureRequest: true });
  const stdin = mockStdin("Task from stdin +today");

  try {
    await add([], { file: "-" });
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
  }

  // Verify the endpoint was called correctly
  assertStringIncludes(fetch.captured.endpoint || "", "/api/addTask");
  assertEquals(fetch.captured.body, "Task from stdin +today");
  assertEquals(fetch.captured.contentType, "text/plain");

  exit.restore();
  cons.restore();
  fetch.restore();
  stdin.restore();
});

/**
 * Test: Reading JSON from stdin
 */
Deno.test("add command - stdin with JSON creates task", async () => {
  setOptions({ apiToken: "test-token", quiet: true });

  const exit = mockExit();
  const cons = mockConsole();
  const fetch = mockFetch({ captureRequest: true });
  const stdinContent = '{"db":"Tasks","title":"JSON task","done":false}';
  const stdin = mockStdin(stdinContent);

  try {
    await add([], { file: "-" });
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
  }

  // Verify JSON was detected and sent correctly
  assertStringIncludes(fetch.captured.endpoint || "", "/api/addTask");
  assertEquals(fetch.captured.body, stdinContent);
  assertEquals(fetch.captured.contentType, "application/json");

  exit.restore();
  cons.restore();
  fetch.restore();
  stdin.restore();
});

/**
 * Test: Empty stdin shows error
 */
Deno.test("add command - empty stdin shows error", async () => {
  setOptions({ apiToken: "test-token", quiet: true });

  const exit = mockExit();
  const cons = mockConsole();
  const stdin = mockStdin("");

  try {
    await add([], { file: "-" });
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
  }

  assertEquals(exit.exitCode, 1);
  assertStringIncludes(cons.stderr, "Stdin was empty");

  exit.restore();
  cons.restore();
  stdin.restore();
});

/**
 * Test: Reading from file with JSON
 */
Deno.test("add command - file with JSON creates task", async () => {
  setOptions({ apiToken: "test-token", quiet: true });

  const exit = mockExit();
  const cons = mockConsole();
  const fetch = mockFetch({ captureRequest: true });

  // Create a temporary file with JSON content
  const tempFile = await Deno.makeTempFile({ suffix: ".json" });
  const jsonContent = '{"db":"Tasks","title":"Task from file","done":false}';
  await Deno.writeTextFile(tempFile, jsonContent);

  try {
    await add([], { file: tempFile });
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
  } finally {
    // Clean up temp file
    try {
      await Deno.remove(tempFile);
    } catch {
      // Ignore cleanup errors
    }
  }

  // Verify JSON file was processed correctly
  assertStringIncludes(fetch.captured.endpoint || "", "/api/addTask");
  assertEquals(fetch.captured.body, jsonContent);
  assertEquals(fetch.captured.contentType, "application/json");

  exit.restore();
  cons.restore();
  fetch.restore();
});

/**
 * Test: Reading from file with plain text
 */
Deno.test("add command - file with plain text creates task", async () => {
  setOptions({ apiToken: "test-token", quiet: true });

  const exit = mockExit();
  const cons = mockConsole();
  const fetch = mockFetch({ captureRequest: true });

  // Create a temporary file with plain text
  const tempFile = await Deno.makeTempFile({ suffix: ".txt" });
  const textContent = "Task from text file +tomorrow";
  await Deno.writeTextFile(tempFile, textContent);

  try {
    await add([], { file: tempFile });
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
  } finally {
    try {
      await Deno.remove(tempFile);
    } catch {
      // Ignore cleanup errors
    }
  }

  // Verify text file was processed correctly
  assertStringIncludes(fetch.captured.endpoint || "", "/api/addTask");
  assertEquals(fetch.captured.body, textContent);
  assertEquals(fetch.captured.contentType, "text/plain");

  exit.restore();
  cons.restore();
  fetch.restore();
});

/**
 * Test: File with project JSON routes to correct endpoint
 */
Deno.test("add command - file with project JSON creates project", async () => {
  setOptions({ apiToken: "test-token", quiet: true });

  const exit = mockExit();
  const cons = mockConsole();
  const fetch = mockFetch({ captureRequest: true });

  // Create a temporary file with project JSON
  const tempFile = await Deno.makeTempFile({ suffix: ".json" });
  const projectJson = '{"db":"Categories","title":"Project from file"}';
  await Deno.writeTextFile(tempFile, projectJson);

  try {
    await add([], { file: tempFile });
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
  } finally {
    try {
      await Deno.remove(tempFile);
    } catch {
      // Ignore cleanup errors
    }
  }

  // Verify project endpoint was used
  assertStringIncludes(fetch.captured.endpoint || "", "/api/addProject");
  assertEquals(fetch.captured.body, projectJson);
  assertEquals(fetch.captured.contentType, "application/json");

  exit.restore();
  cons.restore();
  fetch.restore();
});

/**
 * Test: Empty file shows error
 */
Deno.test("add command - empty file shows error", async () => {
  setOptions({ apiToken: "test-token", quiet: true });

  const exit = mockExit();
  const cons = mockConsole();

  // Create an empty temporary file
  const tempFile = await Deno.makeTempFile();
  await Deno.writeTextFile(tempFile, "");

  try {
    await add([], { file: tempFile });
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
  } finally {
    try {
      await Deno.remove(tempFile);
    } catch {
      // Ignore cleanup errors
    }
  }

  assertEquals(exit.exitCode, 1);
  assertStringIncludes(cons.stderr, "File was empty");

  exit.restore();
  cons.restore();
});
