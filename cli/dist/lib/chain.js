import { defineChain, createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
dotenv.config();
export const mstTestnet = defineChain({
    id: 91562037,
    name: "MST Testnet",
    nativeCurrency: {
        decimals: 18,
        name: "tMSTC",
        symbol: "tMSTC",
    },
    rpcUrls: {
        default: { http: ["https://testnetrpc.mstblockchain.com"] },
    },
    blockExplorers: {
        default: { name: "MSTScan", url: "https://testnet.mstscan.com" },
    },
});
export const anvilLocal = defineChain({
    id: 31337,
    name: "Anvil Local",
    nativeCurrency: {
        decimals: 18,
        name: "ETH",
        symbol: "ETH",
    },
    rpcUrls: {
        default: { http: ["http://127.0.0.1:8545"] },
    },
});
export function loadConfig(cwd = process.cwd()) {
    const configPath = path.join(cwd, ".solgit.json");
    let fileConfig = {};
    if (fs.existsSync(configPath)) {
        try {
            fileConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        }
        catch {
            // Ignore parse error, fall back to env
        }
    }
    const rpcUrl = fileConfig.rpcUrl || process.env.MST_TESTNET_RPC_URL || process.env.RPC_URL || "https://testnetrpc.mstblockchain.com";
    const chainId = fileConfig.chainId || (rpcUrl.includes("127.0.0.1") || rpcUrl.includes("localhost") ? 31337 : 91562037);
    const routerAddress = (fileConfig.routerAddress || process.env.ROUTER_ADDRESS);
    const registryAddress = (fileConfig.registryAddress || process.env.REGISTRY_ADDRESS);
    const privateKey = (fileConfig.privateKey || process.env.PRIVATE_KEY);
    return {
        rpcUrl,
        chainId,
        routerAddress,
        registryAddress,
        privateKey: privateKey?.startsWith("0x") ? privateKey : privateKey ? `0x${privateKey}` : undefined,
    };
}
export function saveConfig(config, cwd = process.cwd()) {
    const configPath = path.join(cwd, ".solgit.json");
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}
export function getChain(config) {
    if (config.chainId === 31337 || config.rpcUrl.includes("127.0.0.1") || config.rpcUrl.includes("localhost")) {
        return anvilLocal;
    }
    return {
        ...mstTestnet,
        rpcUrls: {
            default: { http: [config.rpcUrl] },
        },
    };
}
export function getPublicClient(config) {
    const chain = getChain(config);
    return createPublicClient({
        chain,
        transport: http(config.rpcUrl),
    });
}
export function getWalletClient(config) {
    if (!config.privateKey) {
        throw new Error("Private key not configured. Set PRIVATE_KEY in .env or run 'solgit init'");
    }
    const chain = getChain(config);
    const account = privateKeyToAccount(config.privateKey);
    return createWalletClient({
        account,
        chain,
        transport: http(config.rpcUrl),
    });
}
