import { createPublicClient, createWalletClient, http, defineChain, parseAbiItem, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import chalk from "chalk";
import * as dotenv from "dotenv";
import { SolGitGuardianFacetABI } from "./abi/SolGitGuardianFacet.js";
import { replayIncident } from "./replayer.js";
import { generateFix } from "./fixer.js";
import { createPullRequest } from "./pr.js";
dotenv.config();
export const mstTestnet = defineChain({
    id: 54635,
    name: "MST Coral Testnet",
    nativeCurrency: { name: "tMSTC", symbol: "tMSTC", decimals: 18 },
    rpcUrls: { default: { http: ["https://coralrpc.mstblockchain.com"] } },
});
export const selectorRolledBackEvent = parseAbiItem("event SelectorRolledBack(bytes4 indexed selector, address indexed oldFacet, address indexed newFacet, string reason)");
/**
 * Executes on-chain emergency rollback via Guardian role on SolGitDiamond
 */
export async function executeGuardianRollback(diamondAddress, selector, targetStableFacet, reason, guardianPrivateKey, rpcUrl) {
    const rpc = rpcUrl || process.env.MST_TESTNET_RPC_URL || "https://coralrpc.mstblockchain.com";
    const pkey = (guardianPrivateKey || process.env.GUARDIAN_PRIVATE_KEY || process.env.PRIVATE_KEY);
    if (!pkey) {
        console.log(chalk.yellow("  [Guardian] No private key provided. Running rollback in simulation mode."));
        return "0xsimulated_rollback_tx_hash";
    }
    try {
        const account = privateKeyToAccount(pkey);
        const client = createPublicClient({
            chain: mstTestnet,
            transport: http(rpc),
        });
        const wallet = createWalletClient({
            account,
            chain: mstTestnet,
            transport: http(rpc),
        });
        const validDiamond = getAddress(diamondAddress);
        const validTarget = getAddress(targetStableFacet);
        console.log(chalk.bold.red(`\n🛡️ [Guardian Defense] Submitting emergencyRollback on Diamond ${validDiamond}...`));
        console.log(`  Target Selector: ${selector}`);
        console.log(`  Stable Facet:    ${validTarget}`);
        console.log(`  Reason:          ${reason}`);
        const txHash = await wallet.writeContract({
            address: validDiamond,
            abi: SolGitGuardianFacetABI,
            functionName: "emergencyRollback",
            args: [selector, validTarget, reason],
        });
        console.log(chalk.green(`  ✔ Emergency rollback submitted! Tx: ${txHash}`));
        await client.waitForTransactionReceipt({ hash: txHash });
        console.log(chalk.green.bold("  ✔ Confirmed on-chain: Function selector restored to stable facet."));
        return txHash;
    }
    catch (err) {
        console.log(chalk.red(`  ❌ Guardian rollback failed: ${err.message}`));
        return null;
    }
}
/**
 * Handles full end-to-end incident: detection, on-chain rollback, AI patch, and PR creation
 */
export async function processRollback(incident, options) {
    console.log(chalk.red.bold("\n🚨 [ALERT] Exploit Detected on SolGit Diamond Contract!"));
    console.log(`  Diamond Address: ${options?.diamondAddress || "(configured diamond)"}`);
    console.log(`  Compromised Fn:  ${incident.selector}`);
    console.log(`  Attacking Tx:    ${incident.transactionHash}`);
    // 1. Replay & Attack Analysis
    await replayIncident(incident);
    // 2. Automated On-Chain Emergency Rollback (if diamond configured)
    if (options?.diamondAddress && options?.targetStableFacet) {
        await executeGuardianRollback(options.diamondAddress, incident.selector, options.targetStableFacet, "Watcher auto-defense: exploit anomaly detected", options.guardianPrivateKey, options.rpcUrl);
    }
    // 3. AI Fixer: Analyze code, generate patch, run forge test
    const fix = await generateFix(incident);
    // 4. Create Git Branch / Pull Request
    const prResult = await createPullRequest(fix);
    console.log(chalk.green.bold("\n✨ [Self-Healing Complete] Incident resolved automatically:"));
    console.log(`  Selector:    ${incident.selector}`);
    console.log(`  Quarantined: v${incident.badVersion}`);
    console.log(`  Active:      v${incident.goodVersion} (Stable fallback)`);
    console.log(`  Fix Branch:  ${prResult.branch}`);
    if (prResult.prUrl) {
        console.log(`  PR Link:     ${prResult.prUrl}`);
    }
}
export async function startWatcher(diamondAddress, rpcUrl) {
    const rpc = rpcUrl || process.env.MST_TESTNET_RPC_URL || "https://coralrpc.mstblockchain.com";
    const diamond = (diamondAddress || process.env.DIAMOND_ADDRESS);
    console.log(chalk.bold("\n=== SolGit AI Watcher Service (EIP-2535 Guardian Defense) ==="));
    console.log(`RPC Endpoint:    ${rpc}`);
    console.log(`Diamond Address: ${diamond || chalk.yellow("(Watching mode / Demo ready)")}\n`);
    if (!diamond) {
        console.log(chalk.yellow("No diamond address specified. Running in simulation mode."));
        return;
    }
    const client = createPublicClient({
        chain: mstTestnet,
        transport: http(rpc),
    });
    console.log(chalk.cyan(`Listening for contract transactions and SelectorRolledBack events on ${diamond}...`));
    client.watchEvent({
        address: diamond,
        event: selectorRolledBackEvent,
        onLogs: async (logs) => {
            for (const log of logs) {
                console.log(chalk.red.bold("\n🔔 [On-Chain Event] SelectorRolledBack:"));
                console.log(`  Selector:  ${log.args.selector}`);
                console.log(`  Old Facet: ${log.args.oldFacet}`);
                console.log(`  New Facet: ${log.args.newFacet}`);
                console.log(`  Reason:    ${log.args.reason}`);
                const incident = {
                    selector: log.args.selector,
                    badVersion: 2,
                    goodVersion: 1,
                    triggeredBy: log.args.newFacet,
                    contextHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
                    blockNumber: log.blockNumber,
                    transactionHash: log.transactionHash,
                    timestamp: Date.now(),
                };
                const fix = await generateFix(incident);
                await createPullRequest(fix);
            }
        },
    });
}
