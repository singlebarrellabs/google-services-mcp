#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { dispatchCommand } from "./cli.js";
import { createServer } from "./server.js";
import { parseServices } from "./tool-filter.js";

// A client closing the pipe (EPIPE, common after a large tool result) must not
// crash the process with an unhandled 'error' event.
process.stdout.on("error", (error: NodeJS.ErrnoException) => {
  process.stderr.write(`stdout error (${error.code ?? "unknown"}); exiting\n`);
  process.exit(error.code === "EPIPE" ? 0 : 1);
});

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args[0] === undefined || args[0] === "serve") {
    const serveArgs = args[0] === "serve" ? args.slice(1) : args;
    let services: ReturnType<typeof parseServices> | undefined;
    try {
      const index = serveArgs.indexOf("--services");
      if (index !== -1) {
        const value = serveArgs[index + 1];
        if (value === undefined) throw new Error("--services needs a value");
        services = parseServices(value);
      }
    } catch (error) {
      process.stderr.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
      return;
    }

    const server = createServer({ services });
    const transport = new StdioServerTransport();
    await server.connect(transport);
    return;
  }

  const result = await dispatchCommand(args);
  process.stdout.write(result.output);
  process.exitCode = result.exitCode;
}

main().catch((error) => {
  process.stderr.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
