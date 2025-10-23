/**
 * Integration test for add command
 *
 * Tests the actual decision-making logic of the add command by testing
 * the extracted pure function that contains the core logic.
 */

import { assertEquals } from "https://deno.land/std@0.184.0/testing/asserts.ts";
import { decideAddAction } from "../src/commands/add_testable.ts";

/**
 * Test: Help flag
 */
Deno.test("add command - help flag returns help action", () => {
  const result = decideAddAction([], { help: true });

  assertEquals(result.action, "help");
});

/**
 * Test: Adding task by title (implicit)
 */
Deno.test("add command - simple task title", () => {
  const result = decideAddAction(["Buy groceries"], {});

  assertEquals(result.action, "add_task");
  assertEquals(result.endpoint, "/api/addTask");
  assertEquals(result.body, "Buy groceries");
  assertEquals(result.contentType, "text/plain");
});

/**
 * Test: Adding task by title (explicit)
 */
Deno.test("add command - explicit task with title", () => {
  const result = decideAddAction(["task", "Buy milk +today"], {});

  assertEquals(result.action, "add_task");
  assertEquals(result.endpoint, "/api/addTask");
  assertEquals(result.body, "Buy milk +today");
  assertEquals(result.contentType, "text/plain");
});

/**
 * Test: Adding project
 */
Deno.test("add command - project with title", () => {
  const result = decideAddAction(["project", "Q1 Planning"], {});

  assertEquals(result.action, "add_project");
  assertEquals(result.endpoint, "/api/addProject");
  assertEquals(result.body, "Q1 Planning");
  assertEquals(result.contentType, "text/plain");
});

/**
 * Test: JSON file with task
 */
Deno.test("add command - JSON file containing task", () => {
  const jsonContent = '{"db":"Tasks","title":"My task","done":false}';

  const result = decideAddAction([], { file: "task.json" }, jsonContent);

  assertEquals(result.action, "add_task");
  assertEquals(result.endpoint, "/api/addTask");
  assertEquals(result.body, jsonContent);
  assertEquals(result.contentType, "application/json");
});

/**
 * Test: JSON file with project (Category)
 */
Deno.test("add command - JSON file containing project", () => {
  const jsonContent = '{"db":"Categories","title":"My project"}';

  const result = decideAddAction([], { file: "project.json" }, jsonContent);

  assertEquals(result.action, "add_project");
  assertEquals(result.endpoint, "/api/addProject");
  assertEquals(result.body, jsonContent);
  assertEquals(result.contentType, "application/json");
});

/**
 * Test: Plain text file (not JSON)
 */
Deno.test("add command - plain text file", () => {
  const textContent = "My task title +today";

  const result = decideAddAction([], { file: "task.txt" }, textContent);

  assertEquals(result.action, "add_task");
  assertEquals(result.endpoint, "/api/addTask");
  assertEquals(result.body, textContent);
  assertEquals(result.contentType, "text/plain");
});

/**
 * Test: Malformed JSON file (starts with { but invalid)
 */
Deno.test("add command - malformed JSON treated as plain text", () => {
  const invalidJson = "{this is not valid json}";

  const result = decideAddAction([], { file: "bad.json" }, invalidJson);

  assertEquals(result.action, "add_task");
  assertEquals(result.endpoint, "/api/addTask");
  assertEquals(result.body, invalidJson);
  assertEquals(result.contentType, "text/plain");
});

/**
 * Test: Empty file error
 */
Deno.test("add command - empty file returns error", () => {
  const result = decideAddAction([], { file: "empty.txt" }, "");

  assertEquals(result.action, "error");
  assertEquals(result.errorMessage, "File was empty");
});

/**
 * Test: No parameters error
 */
Deno.test("add command - no parameters returns error", () => {
  const result = decideAddAction([], {});

  assertEquals(result.action, "error");
  assertEquals(result.errorMessage, "No parameters provided");
});

/**
 * Test: Missing task title error
 */
Deno.test("add command - 'add task' without title returns error", () => {
  const result = decideAddAction(["task"], {});

  assertEquals(result.action, "error");
  assertEquals(result.errorMessage, "Missing task title");
});

/**
 * Test: Missing project title error
 */
Deno.test("add command - 'add project' without title returns error", () => {
  const result = decideAddAction(["project"], {});

  assertEquals(result.action, "error");
  assertEquals(result.errorMessage, "Missing project title");
});
