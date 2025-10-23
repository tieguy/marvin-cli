/**
 * Testable version of add command logic
 *
 * Extracts the core decision-making logic from add.ts so it can be tested
 * without Deno.exit() calls or API calls.
 */

export interface AddCommandDecision {
  action: "help" | "add_task" | "add_project" | "error";
  endpoint?: string;
  body?: string;
  contentType?: string;
  errorMessage?: string;
}

/**
 * Determines what the add command should do based on params and options.
 *
 * This is the testable core of the add command - it makes decisions but doesn't
 * have side effects (no API calls, no Deno.exit, no console output).
 *
 * @param params - Command parameters (e.g., ["task", "Buy milk"])
 * @param cmdOpt - Command options (e.g., { file: "task.json", help: false })
 * @param fileContent - Optional file content if --file flag is used
 * @returns Decision object describing what action to take
 */
export function decideAddAction(
  params: string[],
  cmdOpt: { help?: boolean; file?: string },
  fileContent?: string
): AddCommandDecision {
  // Handle --help flag
  if (cmdOpt.help) {
    return { action: "help" };
  }

  // Handle --file flag
  if (params.length === 0 && cmdOpt.file) {
    if (!fileContent || !fileContent.trim()) {
      return { action: "error", errorMessage: "File was empty" };
    }

    let contentType = "text/plain";
    let endpoint = "/api/addTask";

    // Detect JSON files
    if (fileContent[0] === "{") {
      try {
        const item = JSON.parse(fileContent);
        contentType = "application/json";

        // Route to project endpoint if it's a Category
        if (item.db === "Categories") {
          endpoint = "/api/addProject";
        }
      } catch {
        // Invalid JSON, treat as plain text
      }
    }

    return {
      action: endpoint === "/api/addProject" ? "add_project" : "add_task",
      endpoint,
      body: fileContent,
      contentType,
    };
  }

  // Handle no params (error case)
  if (params.length === 0) {
    return { action: "error", errorMessage: "No parameters provided" };
  }

  // Handle invalid "marvin add task" or "marvin add project" (no title)
  if (params.length === 1 && (params[0] === "task" || params[0] === "project")) {
    return {
      action: "error",
      errorMessage: `Missing ${params[0]} title`,
    };
  }

  // Handle "marvin add <title>" or "marvin add task <title>"
  if (params.length === 1 || (params.length === 2 && params[0] === "task")) {
    const taskTitle = params.length === 1 ? params[0] : params[1];
    return {
      action: "add_task",
      endpoint: "/api/addTask",
      body: taskTitle,
      contentType: "text/plain",
    };
  }

  // Handle "marvin add project <title>"
  if (params.length === 2 && params[0] === "project") {
    return {
      action: "add_project",
      endpoint: "/api/addProject",
      body: params[1],
      contentType: "text/plain",
    };
  }

  // Unknown command format
  return { action: "error", errorMessage: "Invalid command format" };
}
