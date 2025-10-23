/**
 * Tests for error handling type safety improvements
 *
 * These tests verify that error handling properly narrows unknown types
 * before accessing properties like .message
 */

import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.184.0/testing/asserts.ts";

Deno.test("Error type narrowing - Error instance", () => {
  let result: string;

  try {
    throw new Error("Test error message");
  } catch (err) {
    // This is the pattern we use throughout the codebase
    result = err instanceof Error ? err.message : String(err);
  }

  assertEquals(result, "Test error message");
});

Deno.test("Error type narrowing - Non-Error value", () => {
  let result: string;

  try {
    throw "String error";
  } catch (err) {
    result = err instanceof Error ? err.message : String(err);
  }

  assertEquals(result, "String error");
});

Deno.test("Error type narrowing - Object without message", () => {
  let result: string;

  try {
    throw { code: 404, status: "Not Found" };
  } catch (err) {
    result = err instanceof Error ? err.message : String(err);
  }

  // String(object) returns "[object Object]" - this is expected behavior
  assertEquals(result, "[object Object]");
});

Deno.test("Error type narrowing - null value", () => {
  let result: string;

  try {
    throw null;
  } catch (err) {
    result = err instanceof Error ? err.message : String(err);
  }

  assertEquals(result, "null");
});

Deno.test("Error type narrowing - undefined value", () => {
  let result: string;

  try {
    throw undefined;
  } catch (err) {
    result = err instanceof Error ? err.message : String(err);
  }

  assertEquals(result, "undefined");
});
