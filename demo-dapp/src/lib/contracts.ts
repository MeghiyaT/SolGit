import {
  createPublicClient,
  http,
  defineChain,
  type Address,
  parseAbi,
  parseEther,
  formatEther,
} from "viem";

export const mstCoralTestnet = defineChain({
  id: 54635,
  name: "MST Coral Testnet",
  nativeCurrency: { name: "tMSTC", symbol: "tMSTC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://coralrpc.mstblockchain.com"] },
  },
  blockExplorers: {
    default: { name: "MSTScan", url: "https://coralscan.mstblockchain.com" },
  },
});

export const DEFAULT_DIAMOND_ADDRESS: Address = "0x3348f760E980326079011707B9E40a6b29910D69";
export const VAULT_V1_ADDRESS: Address = "0xF717aaE8398DA7E340c781418992b80D692253f8";
export const VAULT_V2_ADDRESS: Address = "0x9169632420f8bb15F67876e0708577F1a757BCB7";
export const VAULT_V2_FIXED_ADDRESS: Address = "0x1bFA792F6cfA1E2B8D24E62a900c76C8983eA8fD";

export const VAULT_ABI = parseAbi([
  "function deposit() external payable",
  "function withdraw(uint256 amount) external",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "event Deposited(address indexed account, uint256 amount)",
  "event Withdrawn(address indexed account, uint256 amount)",
]);

export function getPublicClient(rpcUrl?: string) {
  return createPublicClient({
    chain: mstCoralTestnet,
    transport: http(rpcUrl || "https://coralrpc.mstblockchain.com"),
  });
}

export { parseEther, formatEther };

