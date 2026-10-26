#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { statusCommand } from "./commands/status.js";
import { logCommand } from "./commands/log.js";
import { pushCommand } from "./commands/push.js";
import { promoteCommand } from "./commands/promote.js";
import { diffCommand } from "./commands/diff.js";
const program = new Command();
program
    .name("solgit")
    .description("SolGit: Git-style per-function version control for smart contracts on MST Blockchain")
    .version("1.0.0");
program
    .command("init")
    .description("Initialize SolGit configuration (.solgit.json)")
    .option("--rpc <url>", "MST Testnet RPC URL")
    .option("--chain-id <id>", "Chain ID")
    .option("--router <address>", "SolGitRouter contract address")
    .option("--registry <address>", "VersionRegistry contract address")
    .option("--key <privateKey>", "Deployer/Owner private key")
    .action(initCommand);
program
    .command("status")
    .description("Display the active version and status for all registered function selectors")
    .action(statusCommand);
program
    .command("log [selector]")
    .description("Show the version/commit history for all or a specific selector")
    .action(logCommand);
program
    .command("push <selector> <implementation>")
    .description("Push a new version of a function selector to the VersionRegistry")
    .action(pushCommand);
program
    .command("promote <selector> <version>")
    .description("Promote a version to Stable status (owner only)")
    .action(promoteCommand);
program
    .command("diff <selector> <version1> <version2>")
    .description("Compare metadata and bytecode hash between two versions of a selector")
    .action(diffCommand);
program.parse(process.argv);
