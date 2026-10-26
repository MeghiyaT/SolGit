import chalk from "chalk";
import { loadConfig, getPublicClient } from "../lib/chain.js";
import { VersionRegistryABI } from "../abi/index.js";
const STATUS_NAMES = ["Stable", "Active", "Quarantined"];
export async function diffCommand(selector, v1Str, v2Str) {
    const config = loadConfig();
    if (!config.registryAddress) {
        console.error(chalk.red("Error: Registry address not set. Run 'solgit init --registry <address>'."));
        process.exit(1);
    }
    const v1 = parseInt(v1Str, 10);
    const v2 = parseInt(v2Str, 10);
    if (isNaN(v1) || isNaN(v2)) {
        console.error(chalk.red("Error: Both version parameters must be integers."));
        process.exit(1);
    }
    const client = getPublicClient(config);
    try {
        const [info1, info2] = await Promise.all([
            client.readContract({
                address: config.registryAddress,
                abi: VersionRegistryABI,
                functionName: "getVersion",
                args: [selector, v1],
            }),
            client.readContract({
                address: config.registryAddress,
                abi: VersionRegistryABI,
                functionName: "getVersion",
                args: [selector, v2],
            }),
        ]);
        console.log(chalk.bold(`\nDiff for selector ${chalk.cyan(selector)}: v${v1} ↔ v${v2}`));
        console.log(chalk.gray("=".repeat(60)));
        console.log(`Property            ${`v${v1}`.padEnd(30)} ${`v${v2}`}`);
        console.log(chalk.gray("-".repeat(60)));
        const status1 = STATUS_NAMES[info1.status];
        const status2 = STATUS_NAMES[info2.status];
        console.log(`Status              ${(info1.status === info2.status ? status1 : chalk.yellow(status1)).padEnd(39)} ${info1.status === info2.status ? status2 : chalk.yellow(status2)}`);
        console.log(`Implementation      ${(info1.implementation === info2.implementation ? info1.implementation : chalk.yellow(info1.implementation)).padEnd(39)} ${info1.implementation === info2.implementation ? info2.implementation : chalk.yellow(info2.implementation)}`);
        console.log(`Code Hash           ${(info1.codeHash === info2.codeHash ? info1.codeHash.slice(0, 18) + "..." : chalk.yellow(info1.codeHash.slice(0, 18) + "...")).padEnd(39)} ${info1.codeHash === info2.codeHash ? info2.codeHash.slice(0, 18) + "..." : chalk.yellow(info2.codeHash.slice(0, 18) + "...")}`);
        const date1 = info1.timestamp > 0n ? new Date(Number(info1.timestamp) * 1000).toLocaleString() : "Genesis";
        const date2 = info2.timestamp > 0n ? new Date(Number(info2.timestamp) * 1000).toLocaleString() : "Genesis";
        console.log(`Timestamp           ${date1.padEnd(30)} ${date2}\n`);
        if (info1.codeHash === info2.codeHash) {
            console.log(chalk.green("✔ Identical bytecode implementation hash."));
        }
        else {
            console.log(chalk.yellow("⚡ Implementations have differing bytecode."));
        }
    }
    catch (err) {
        console.error(chalk.red(`Failed to fetch diff: ${err.message}`));
        process.exit(1);
    }
}
