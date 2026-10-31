import {
  createPublicClient,
  createWalletClient,
  http,
  custom,
  defineChain,
  type Address,
  parseAbi,
  parseEther,
  formatEther,
  encodeFunctionData,
  decodeErrorResult,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const mstCoralTestnet = defineChain({
  id: 54635,
  name: "MST Coral Testnet",
  nativeCurrency: { name: "tMSTC", symbol: "tMSTC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://coralrpc.mstblockchain.com"] },
  },
  blockExplorers: {
    default: { name: "MSTScan", url: "https://coral.mstscan.com" },
  },
});

export const DEFAULT_DIAMOND_ADDRESS: Address = "0x56B05b503A117840A73740a1b8744B12732e44e5";
export const VAULT_V1_ADDRESS: Address = "0x463DC23a3E649Cf3FF54762F6588f1D71C207c01";
export const VAULT_V2_ADDRESS: Address = "0x91697d3d38C493F76745dcC72FBe248Fc14fBCB7";
export const VAULT_V2_FIXED_ADDRESS: Address = "0xb1C889707d426A7A386870A03bc70d1b06975990";

/**
 * Public testnet-only burner/faucet key for frictionless 1-click demos without MetaMask.
 * Can be overridden via VITE_ALICE_PRIVATE_KEY environment variable.
 */
export const ALICE_TESTNET_KEY = ((import.meta as unknown as { env?: Record<string, string> })?.env?.VITE_ALICE_PRIVATE_KEY ||
  "0x58f67a2fc47b3e90aa7a1a97b49f7f1b0e90695793da4b8367101d7ae0c59899") as `0x${string}`;
export const ALICE_TESTNET_ADDRESS: Address = "0x0318A1Df19a78f6784CbDDcE768EEF970C561493";

export const VAULT_ABI = parseAbi([
  "function deposit() external payable",
  "function withdraw(uint256 amount) external",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "event Deposited(address indexed account, uint256 amount)",
  "event Withdrawn(address indexed account, uint256 amount)",
  "error InsufficientBalance(uint256 available, uint256 requested)",
  "error InvariantViolation(bytes32 invariantId)",
  "error ZeroAmount()",
  "error ZeroDeposit()",
]);

export function getPublicClient(rpcUrl?: string) {
  return createPublicClient({
    chain: mstCoralTestnet,
    transport: http(rpcUrl || "https://coralrpc.mstblockchain.com"),
  });
}

export function getAliceWalletClient(rpcUrl?: string) {
  const account = privateKeyToAccount(ALICE_TESTNET_KEY);
  return createWalletClient({
    account,
    chain: mstCoralTestnet,
    transport: http(rpcUrl || "https://coralrpc.mstblockchain.com"),
  });
}

export function getInjectedWalletClient(ethereumProvider: any) {
  return createWalletClient({
    chain: mstCoralTestnet,
    transport: custom(ethereumProvider),
  });
}

export { parseEther, formatEther, encodeFunctionData, decodeErrorResult, privateKeyToAccount };
