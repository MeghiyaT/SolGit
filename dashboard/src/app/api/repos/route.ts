import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { getRepositories, saveRepository, type RepoRecord } from "../../../lib/storage";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (address && !isAddress(address)) {
    return NextResponse.json({ error: "Invalid address parameter" }, { status: 400 });
  }

  try {
    const repos = await getRepositories(address || undefined);
    return NextResponse.json({ repositories: repos });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch repositories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      owner_address,
      owner_nickname,
      description,
      contract_address,
      tx_hash,
      sol_code,
      facet_count = 1,
      guardian_active = true,
      is_private = false,
    } = body;

    if (!name || !owner_address || !contract_address || !sol_code) {
      return NextResponse.json(
        { error: "Missing required fields (name, owner_address, contract_address, sol_code)" },
        { status: 400 }
      );
    }

    if (!isAddress(owner_address) || !isAddress(contract_address)) {
      return NextResponse.json(
        { error: "Invalid owner_address or contract_address format" },
        { status: 400 }
      );
    }

    const repoRecord: RepoRecord = {
      id: id || `repo-${Date.now()}`,
      name: name.trim().toLowerCase().replace(/\s+/g, "-"),
      owner_address,
      owner_nickname: owner_nickname || "anonymous",
      description: description || "Smart contract deployed on MST Coral Testnet.",
      contract_address,
      tx_hash: tx_hash || "",
      sol_code,
      facet_count,
      guardian_active,
      is_private,
    };

    const saved = await saveRepository(repoRecord);
    return NextResponse.json({ success: true, repository: saved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save repository";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

