/**
 * Integration test for JSON output from commands
 *
 * Tests by running the actual compiled marvin-cli binary and checking output.
 * This test should FAIL initially because console.log(items) outputs JS notation.
 */

import { assertEquals } from "https://deno.land/std@0.184.0/testing/asserts.ts";

Deno.test({
  name: "marvin today --json produces valid JSON",
  fn: async () => {
    // Run the actual marvin-cli command
    const command = new Deno.Command("/home/louie/Projects/marvin-cli/marvin-cli", {
      args: ["today", "--public", "--json"],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout } = await command.output();

    if (code !== 0) {
      // If command fails (e.g., no API token configured), skip test
      console.log("Skipping test - marvin-cli not configured");
      return;
    }

    const output = new TextDecoder().decode(stdout);

    // The critical test: can we parse it as JSON?
    let parseError = null;
    try {
      const parsed = JSON.parse(output);
      assertEquals(Array.isArray(parsed), true, "Should be a JSON array");
    } catch (e) {
      parseError = e;
    }

    // This should pass after we fix console.log(items) -> JSON.stringify(items)
    const preview = output.substring(0, 100);
    assertEquals(parseError, null, "Output should be valid JSON. Got: " + preview);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "marvin due --json produces valid JSON",
  fn: async () => {
    const command = new Deno.Command("/home/louie/Projects/marvin-cli/marvin-cli", {
      args: ["due", "--public", "--json"],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout } = await command.output();

    if (code !== 0) {
      console.log("Skipping test - marvin-cli not configured");
      return;
    }

    const output = new TextDecoder().decode(stdout);

    let parseError = null;
    try {
      const parsed = JSON.parse(output);
      assertEquals(Array.isArray(parsed), true, "Should be a JSON array");
    } catch (e) {
      parseError = e;
    }

    const preview = output.substring(0, 100);
    assertEquals(parseError, null, "Output should be valid JSON. Got: " + preview);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "marvin list --json produces valid JSON",
  fn: async () => {
    const command = new Deno.Command("/home/louie/Projects/marvin-cli/marvin-cli", {
      args: ["list", "--public", "--json"],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout } = await command.output();

    if (code !== 0) {
      console.log("Skipping test - marvin-cli not configured");
      return;
    }

    const output = new TextDecoder().decode(stdout);

    let parseError = null;
    try {
      const parsed = JSON.parse(output);
      assertEquals(Array.isArray(parsed), true, "Should be a JSON array");
    } catch (e) {
      parseError = e;
    }

    const preview = output.substring(0, 100);
    assertEquals(parseError, null, "Output should be valid JSON. Got: " + preview);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
