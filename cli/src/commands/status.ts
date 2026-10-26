import chalk from "chalk";
import { loadConfig, getPublicClient } from "../lib/chain.js";
import { VersionRegistryABI } from "../abi/index.js";

const STATUS_NAMES = ["Stable", "Active", "Quarantined"] as const;

export async function statusCommand() {
  const config = loadConfig();
  if (!config.registryAddress) {
    console.error(chalk.red("Error: Registry address not set. Run 'solgit init --registry <address>' or set REGISTRY_ADDRESS."));
    process.exit(1);
  }

  const client = getPublicClient(config);

  console.log(chalk.bold(`\nSolGit Version Control Status [Registry: ${config.registryAddress}]`));
  console.log(chalk.gray(`Network: Chain ID ${config.chainId} (${config.rpcUrl})\n`));

  try {
    const selectors = await client.readContract({
      address: config.registryAddress,
      abi: VersionRegistryABI,
      functionName: "getRegisteredSelectors",
    });

    if (selectors.length === 0) {
      console.log(chalk.yellow("No selectors registered yet."));
      return;
    }

    console.log(
      chalk.bold(
        `${"Selector".padEnd(12)} ${"Active Ver".padEnd(12)} ${"Status".padEnd(14)} ${"Stable Ver".padEnd(12)} ${"Implementation Address"}`
      )
    );
    console.log(chalk.gray("-".repeat(80)));

    for (const sel of selectors) {
      try {
        const activeInfo = await client.readContract({
          address: config.registryAddress,
          abi: VersionRegistryABI,
          functionName: "getActiveVersion",
          args: [sel],
        });

        let stableVerStr = "None";
        try {
          const stableVer = await client.readContract({
            address: config.registryAddress,
            abi: VersionRegistryABI,
            functionName: "getLastStableVersion",
            args: [sel],
          });
          stableVerStr = `v${stableVer}`;
        } catch {
          stableVerStr = chalk.gray("None");
        }

        const statusName = STATUS_NAMES[activeInfo.status] ?? "Unknown";
        const statusColored =
          activeInfo.status === 0
            ? chalk.green("✔ Stable")
            : activeInfo.status === 1
            ? chalk.yellow("⚡ Active")
            : chalk.red("✖ Quarantined");

        console.log(
          `${chalk.cyan(sel.padEnd(12))} ${`v${activeInfo.version}`.padEnd(12)} ${statusColored.padEnd(23)} ${stableVerStr.padEnd(12)} ${activeInfo.implementation}`
        );
      } catch (err: any) {
        console.log(`${chalk.cyan(sel.padEnd(12))} ${chalk.red("Error fetching version info")}`);
      }
    }
    console.log("");
  } catch (err: any) {
    console.error(chalk.red(`Failed to read from registry: ${err.message}`));
    process.exit(1);
  }
}
