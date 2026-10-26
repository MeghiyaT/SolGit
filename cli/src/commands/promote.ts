import chalk from "chalk";
import { loadConfig, getPublicClient, getWalletClient } from "../lib/chain.js";
import { VersionRegistryABI } from "../abi/index.js";
import type { Hex } from "viem";

export async function promoteCommand(selector: string, versionStr: string) {
  const config = loadConfig();
  if (!config.registryAddress) {
    console.error(chalk.red("Error: Registry address not set. Run 'solgit init --registry <address>'."));
    process.exit(1);
  }

  const version = parseInt(versionStr, 10);
  if (isNaN(version) || version <= 0) {
    console.error(chalk.red("Error: Version must be a positive integer."));
    process.exit(1);
  }

  const publicClient = getPublicClient(config);
  const walletClient = getWalletClient(config);

  console.log(chalk.bold(`Promoting selector ${chalk.cyan(selector)} v${version} to Stable...`));

  try {
    const hash = await walletClient.writeContract({
      address: config.registryAddress,
      abi: VersionRegistryABI,
      functionName: "promote",
      args: [selector as Hex, version],
    });

    console.log(chalk.gray(`Transaction sent: ${hash}. Waiting for confirmation...`));
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === "success") {
      console.log(chalk.green(`✔ Selector ${selector} v${version} promoted to Stable in block ${receipt.blockNumber}!`));
    } else {
      console.error(chalk.red("Transaction reverted on-chain."));
    }
  } catch (err: any) {
    console.error(chalk.red(`Failed to promote version: ${err.message}`));
    process.exit(1);
  }
}
