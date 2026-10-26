import chalk from "chalk";
import { loadConfig, getPublicClient } from "../lib/chain.js";
import { VersionRegistryABI } from "../abi/index.js";
const STATUS_NAMES = ["Stable", "Active", "Quarantined"];
export async function logCommand(selectorArg) {
    const config = loadConfig();
    if (!config.registryAddress) {
        console.error(chalk.red("Error: Registry address not set. Run 'solgit init --registry <address>'."));
        process.exit(1);
    }
    const client = getPublicClient(config);
    try {
        let selectors = [];
        if (selectorArg) {
            selectors = [selectorArg];
        }
        else {
            const allSels = await client.readContract({
                address: config.registryAddress,
                abi: VersionRegistryABI,
                functionName: "getRegisteredSelectors",
            });
            selectors = [...allSels];
        }
        if (selectors.length === 0) {
            console.log(chalk.yellow("No selectors found."));
            return;
        }
        for (const sel of selectors) {
            console.log(chalk.bold(`\nSelector: ${chalk.cyan(sel)}`));
            console.log(chalk.gray("=".repeat(60)));
            try {
                const history = await client.readContract({
                    address: config.registryAddress,
                    abi: VersionRegistryABI,
                    functionName: "getVersionHistory",
                    args: [sel],
                });
                if (history.length === 0) {
                    console.log(chalk.gray("  (No versions recorded)"));
                    continue;
                }
                // Display in reverse chronological order (newest first, like git log)
                for (let i = history.length - 1; i >= 0; i--) {
                    const item = history[i];
                    const statusColored = item.status === 0
                        ? chalk.green.bold("STABLE")
                        : item.status === 1
                            ? chalk.yellow.bold("ACTIVE")
                            : chalk.red.bold("QUARANTINED");
                    const dateStr = item.timestamp > 0n
                        ? new Date(Number(item.timestamp) * 1000).toLocaleString()
                        : "Genesis";
                    console.log(`commit ${chalk.yellow(item.codeHash.slice(0, 16))} (version ${chalk.bold(item.version)}) [${statusColored}]`);
                    console.log(`Date:           ${dateStr}`);
                    console.log(`Implementation: ${item.implementation}`);
                    console.log(`Code Hash:      ${item.codeHash}\n`);
                }
            }
            catch (err) {
                console.log(chalk.red(`  Error reading history for selector ${sel}: ${err.message}`));
            }
        }
    }
    catch (err) {
        console.error(chalk.red(`Failed to fetch log: ${err.message}`));
        process.exit(1);
    }
}
