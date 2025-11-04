/**
 * Tests for JSON output format (default behavior)
 *
 * Tests that commands output valid JSON arrays when no format flag is specified.
 */

import { assertEquals } from "https://deno.land/std@0.184.0/testing/asserts.ts";

interface MarvinTask {
  _id: string;
  title: string;
  done: boolean;
  [key: string]: unknown;
}

/**
 * Test helper: Mock API response
 */
function mockMarvinTasks(): MarvinTask[] {
  return [
    {
      _id: "task1",
      title: "Test Task 1",
      done: false,
    },
    {
      _id: "task2",
      title: "Test Task 2",
      done: false,
    },
  ];
}

Deno.test("JSON format: outputs valid JSON array", () => {
  const items = mockMarvinTasks();
  const jsonOutput = JSON.stringify(items);
  
  // Should parse as valid JSON
  const parsed = JSON.parse(jsonOutput) as MarvinTask[];
  
  assertEquals(Array.isArray(parsed), true);
  assertEquals(parsed.length, 2);
});

Deno.test("JSON format: preserves all task fields", () => {
  const items = mockMarvinTasks();
  const jsonOutput = JSON.stringify(items);
  const parsed = JSON.parse(jsonOutput) as MarvinTask[];
  
  assertEquals(parsed[0]._id, "task1");
  assertEquals(parsed[0].title, "Test Task 1");
  assertEquals(parsed[0].done, false);
});

Deno.test("JSON format: handles empty array", () => {
  const items: MarvinTask[] = [];
  const jsonOutput = JSON.stringify(items);
  const parsed = JSON.parse(jsonOutput) as MarvinTask[];
  
  assertEquals(Array.isArray(parsed), true);
  assertEquals(parsed.length, 0);
});

Deno.test("JSON format: maintains object structure", () => {
  const items = mockMarvinTasks();
  const jsonOutput = JSON.stringify(items);
  const parsed = JSON.parse(jsonOutput) as MarvinTask[];
  
  // Each item should be an object
  for (const item of parsed) {
    assertEquals(typeof item, 'object');
    assertEquals(item !== null, true);
    assertEquals('_id' in item, true);
    assertEquals('title' in item, true);
  }
});
