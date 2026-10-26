import { createPublicClient, http, defineChain, parseAbiItem } from "viem";
import chalk from "chalk";
import * as dotenv from "dotenv";
import { replayIncident } from "./replayer.js";
import { generateFix } from "./fixer.js";
import { createPullRequest } from "./pr.js";
dotenv.config();
const mstTestnet = defineChain({
    id: 91562037,
    name: "MST Testnet",
    nativeCurrency: { name: "tMSTC", symbol: "tMSTC", decimals: 18 },
    rpcUrls: { default: { http: ["https://testnetrpc.mstblockchain.com"] } },
});
export const featureRolledBackEvent = parseAbiItem("event FeatureRolledBack(bytes4 indexed selector, uint32 badVersion, uint32 goodVersion, address indexed triggeredBy, bytes32 contextHash)");
export async function processRollback(incident) {
    console.log(chalk.red.bold("\n🚨 [ALERT] FeatureRolledBack event detected on SolGitRouter!"));
    // 1. Replay / incident analysis
    await replayIncident(incident);
    // 2. AI Fixer
    const fix = await generateFix(incident);
    // 3. Create Pull Request
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
export async function startWatcher(routerAddress, rpcUrl) {
    const rpc = rpcUrl || process.env.MST_TESTNET_RPC_URL || "https://testnetrpc.mstblockchain.com";
    const router = (routerAddress || process.env.ROUTER_ADDRESS);
    console.log(chalk.bold("\n=== SolGit AI Watcher Service ==="));
    console.log(`RPC Endpoint:   ${rpc}`);
    console.log(`Router Address: ${router || chalk.yellow("(Watching mode / Demo ready)")}\n`);
    if (!router) {
        console.log(chalk.yellow("No router address specified. Running in simulation mode."));
        return;
    }
    const client = createPublicClient({
        chain: mstTestnet,
        transport: http(rpc),
    });
    console.log(chalk.cyan(`Listening for FeatureRolledBack events on ${router}...`));
    let lastBlock = await client.getBlockNumber();
    // Polling loop
    setInterval(async () => {
        try {
            const currentBlock = await client.getBlockNumber();
            if (currentBlock > lastBlock) {
                const logs = await client.getLogs({
                    address: router,
                    event: featureRolledBackEvent,
                    fromBlock: lastBlock + 1n,
                    toBlock: currentBlock,
                });
                for (const log of logs) {
                    const { selector, badVersion, goodVersion, triggeredBy, contextHash } = log.args;
                    await processRollback({
                        selector,
                        badVersion,
                        goodVersion,
                        triggeredBy,
                        contextHash,
                        blockNumber: log.blockNumber,
                        transactionHash: log.transactionHash,
                        timestamp: Date.now(),
                    });
                }
                lastBlock = currentBlock;
            }
        }
        catch (err) {
            // Ignore transient network errors
        }
    }, 3000);
}
