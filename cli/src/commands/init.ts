import chalk from "chalk";
import { saveConfig, loadConfig, type SolGitConfig } from "../lib/chain.js";
import type { Address } from "viem";

export async function initCommand(options: {
  rpc?: string;
  chainId?: string;
  diamond?: string;
  router?: string;
  registry?: string;
  guardian?: string;
  key?: string;
}) {
  const current = loadConfig();

  const diamondAddr = (options.diamond || options.router || current.diamondAddress || current.routerAddress) as Address | undefined;

  const config: SolGitConfig = {
    rpcUrl: options.rpc || current.rpcUrl || "https://coralrpc.mstblockchain.com",
    chainId: options.chainId ? parseInt(options.chainId, 10) : current.chainId || 54635,
    diamondAddress: diamondAddr,
    routerAddress: diamondAddr,
    registryAddress: (options.registry || current.registryAddress) as Address | undefined,
    guardianAddress: (options.guardian || current.guardianAddress) as Address | undefined,
    privateKey: (options.key || current.privateKey) as `0x${string}` | undefined,
  };

  saveConfig(config);

  console.log(chalk.green("✔ SolGit configuration initialized successfully (.solgit.json)"));
  console.log(chalk.cyan(`  RPC URL:          ${config.rpcUrl}`));
  console.log(chalk.cyan(`  Chain ID:         ${config.chainId}`));
  console.log(chalk.cyan(`  Diamond Address:  ${config.diamondAddress || chalk.gray("(not set)")}`));
  console.log(chalk.cyan(`  Registry Address: ${config.registryAddress || chalk.gray("(not set)")}`));
  console.log(chalk.cyan(`  Guardian Address: ${config.guardianAddress || chalk.gray("(not set)")}`));
  console.log(chalk.cyan(`  Private Key:      ${config.privateKey ? chalk.gray("••••••••") : chalk.gray("(not set)")}`));
}
