import chalk from "chalk";
import { saveConfig, loadConfig, type SolGitConfig } from "../lib/chain.js";
import type { Address } from "viem";

export async function initCommand(options: {
  rpc?: string;
  chainId?: string;
  router?: string;
  registry?: string;
  key?: string;
}) {
  const current = loadConfig();

  const config: SolGitConfig = {
    rpcUrl: options.rpc || current.rpcUrl || "https://testnetrpc.mstblockchain.com",
    chainId: options.chainId ? parseInt(options.chainId, 10) : current.chainId || 91562037,
    routerAddress: (options.router || current.routerAddress) as Address | undefined,
    registryAddress: (options.registry || current.registryAddress) as Address | undefined,
    privateKey: (options.key || current.privateKey) as `0x${string}` | undefined,
  };

  saveConfig(config);

  console.log(chalk.green("✔ SolGit configuration initialized successfully (.solgit.json)"));
  console.log(chalk.cyan(`  RPC URL:          ${config.rpcUrl}`));
  console.log(chalk.cyan(`  Chain ID:         ${config.chainId}`));
  console.log(chalk.cyan(`  Router Address:   ${config.routerAddress || chalk.gray("(not set)")}`));
  console.log(chalk.cyan(`  Registry Address: ${config.registryAddress || chalk.gray("(not set)")}`));
  console.log(chalk.cyan(`  Private Key:      ${config.privateKey ? chalk.gray("••••••••") : chalk.gray("(not set)")}`));
}
