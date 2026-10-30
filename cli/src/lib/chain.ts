import { defineChain, createPublicClient, createWalletClient, http, type Chain, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

export interface SolGitConfig {
  rpcUrl: string;
  chainId: number;
  diamondAddress?: Address;
  routerAddress?: Address;
  registryAddress?: Address;
  guardianAddress?: Address;
  privateKey?: `0x${string}`;
}

export const mstTestnet = defineChain({
  id: 54635,
  name: "MST Coral Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "tMSTC",
    symbol: "tMSTC",
  },
  rpcUrls: {
    default: { http: ["https://coralrpc.mstblockchain.com"] },
  },
  blockExplorers: {
    default: { name: "MSTScan", url: "https://coral.mstscan.com" },
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

export function loadConfig(cwd: string = process.cwd()): SolGitConfig {
  const configPath = path.join(cwd, ".solgit.json");
  let fileConfig: Partial<SolGitConfig> = {};
  if (fs.existsSync(configPath)) {
    try {
      fileConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    } catch {
      // Ignore parse error, fall back to env
    }
  }

  const rpcUrl = fileConfig.rpcUrl || process.env.MST_TESTNET_RPC_URL || process.env.RPC_URL || "https://coralrpc.mstblockchain.com";
  const chainId = fileConfig.chainId || (rpcUrl.includes("127.0.0.1") || rpcUrl.includes("localhost") ? 31337 : 54635);
  const routerAddress = (fileConfig.routerAddress || process.env.ROUTER_ADDRESS) as Address | undefined;
  const registryAddress = (fileConfig.registryAddress || process.env.REGISTRY_ADDRESS) as Address | undefined;
  const privateKey = (fileConfig.privateKey || process.env.PRIVATE_KEY) as `0x${string}` | undefined;

  return {
    rpcUrl,
    chainId,
    routerAddress,
    registryAddress,
    privateKey: privateKey?.startsWith("0x") ? privateKey : privateKey ? `0x${privateKey}` as `0x${string}` : undefined,
  };
}

export function saveConfig(config: SolGitConfig, cwd: string = process.cwd()) {
  const configPath = path.join(cwd, ".solgit.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}

export function getChain(config: SolGitConfig): Chain {
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

export function getPublicClient(config: SolGitConfig) {
  const chain = getChain(config);
  return createPublicClient({
    chain,
    transport: http(config.rpcUrl),
  });
}

export function getWalletClient(config: SolGitConfig) {
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
