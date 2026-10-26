import chalk from "chalk";
import { loadConfig, getPublicClient, getWalletClient } from "../lib/chain.js";
import { VersionRegistryABI } from "../abi/index.js";
export async function pushCommand(selector, implementation) {
    const config = loadConfig();
    if (!config.registryAddress) {
        console.error(chalk.red("Error: Registry address not set. Run 'solgit init --registry <address>'."));
        process.exit(1);
    }
    const publicClient = getPublicClient(config);
    const walletClient = getWalletClient(config);
    console.log(chalk.bold(`Pushing new version for selector ${chalk.cyan(selector)}...`));
    console.log(`Implementation: ${implementation}`);
    try {
        const hash = await walletClient.writeContract({
            address: config.registryAddress,
            abi: VersionRegistryABI,
            functionName: "pushVersion",
            args: [selector, implementation],
        });
        console.log(chalk.gray(`Transaction sent: ${hash}. Waiting for confirmation...`));
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status === "success") {
            console.log(chalk.green(`✔ Version pushed successfully in block ${receipt.blockNumber}!`));
        }
        else {
            console.error(chalk.red("Transaction reverted on-chain."));
        }
    }
    catch (err) {
        console.error(chalk.red(`Failed to push version: ${err.message}`));
        process.exit(1);
    }
}
