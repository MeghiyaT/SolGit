import chalk from "chalk";
import { saveConfig, loadConfig } from "../lib/chain.js";
export async function initCommand(options) {
    const current = loadConfig();
    const diamondAddr = (options.diamond || options.router || current.diamondAddress || current.routerAddress);
    const config = {
        rpcUrl: options.rpc || current.rpcUrl || "https://coralrpc.mstblockchain.com",
        chainId: options.chainId ? parseInt(options.chainId, 10) : current.chainId || 54635,
        diamondAddress: diamondAddr,
        routerAddress: diamondAddr,
        registryAddress: (options.registry || current.registryAddress),
        guardianAddress: (options.guardian || current.guardianAddress),
        privateKey: (options.key || current.privateKey),
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
