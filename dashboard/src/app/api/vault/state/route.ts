import { NextRequest, NextResponse } from "next/server";

interface VaultState {
  tvl: number;
  stolen: number;
  isHacked: boolean;
  isMerged: boolean;
  lastAction: string;
  lastUpdated: number;
}

let globalVaultState: VaultState = {
  tvl: 15.0,
  stolen: 0.0,
  isHacked: false,
  isMerged: false,
  lastAction: "init",
  lastUpdated: Date.now(),
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  return NextResponse.json(globalVaultState, { headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.action === "deposit" && typeof body.amount === "number") {
      globalVaultState.tvl = +(globalVaultState.tvl + body.amount).toFixed(4);
      globalVaultState.lastAction = "deposit";
    } else if (body.action === "withdraw" && typeof body.amount === "number") {
      globalVaultState.tvl = Math.max(0, +(globalVaultState.tvl - body.amount).toFixed(4));
      globalVaultState.lastAction = "withdraw";
    } else if (body.action === "exploit") {
      globalVaultState.isHacked = true;
      globalVaultState.lastAction = "exploit";
    } else if (body.action === "merge") {
      globalVaultState.isMerged = true;
      globalVaultState.lastAction = "merge";
    } else if (body.action === "reset") {
      globalVaultState = {
        tvl: 15.0,
        stolen: 0.0,
        isHacked: false,
        isMerged: false,
        lastAction: "reset",
        lastUpdated: Date.now(),
      };
    } else if (typeof body.tvl === "number") {
      globalVaultState.tvl = body.tvl;
    }

    globalVaultState.lastUpdated = Date.now();
    return NextResponse.json(globalVaultState, { headers: CORS_HEADERS });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ error: msg }, { status: 400, headers: CORS_HEADERS });
  }
}

