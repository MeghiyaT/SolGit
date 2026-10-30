import { defineChain, getAddress, type Chain } from "viem";

export const MST_CHAIN_ID = 54635;
export const MST_RPC_URL = "https://coralrpc.mstblockchain.com";
export const MST_FAUCET_URL = "https://faucet.mstblockchain.com";
export const MST_EXPLORER_URL = "https://coral.mstscan.com";

export const mstTestnet: Chain = defineChain({
  id: MST_CHAIN_ID,
  name: "MST Coral Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "MST Coin",
    symbol: "tMSTC",
  },
  rpcUrls: {
    default: {
      http: [MST_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: "MST Coral Explorer",
      url: MST_EXPLORER_URL,
    },
  },
  testnet: true,
});

export function formatAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address) return "";
  try {
    const checksummed = getAddress(address);
    if (checksummed.length <= startChars + endChars) return checksummed;
    return `${checksummed.slice(0, startChars)}...${checksummed.slice(-endChars)}`;
  } catch {
    if (address.length <= startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  }
}

export function generateIdenticonGradient(address: string): string {
  if (!address) return "linear-gradient(135deg, #238636, #2ea043)";
  const clean = address.toLowerCase().replace(/^0x/, "");
  const hash1 = parseInt(clean.slice(0, 6) || "0", 16);
  const hash2 = parseInt(clean.slice(6, 12) || "0", 16);
  const hash3 = parseInt(clean.slice(12, 18) || "0", 16);

  const hue1 = hash1 % 360;
  const hue2 = (hash2 + 90) % 360;
  const angle = (hash3 % 180) + 45;

  return `linear-gradient(${angle}deg, hsl(${hue1}, 75%, 45%), hsl(${hue2}, 85%, 55%))`;
}

