import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { getUser, saveUser } from "../../../lib/storage";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address || !isAddress(address, { strict: false })) {
    return NextResponse.json({ error: "A valid address query parameter is required" }, { status: 400 });
  }

  try {
    const user = await getUser(address);
    return NextResponse.json({ user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, nickname } = body;

    if (!address || !nickname) {
      return NextResponse.json(
        { error: "Both address and nickname are required" },
        { status: 400 }
      );
    }

    if (!isAddress(address, { strict: false })) {
      return NextResponse.json(
        { error: "Invalid Ethereum/MST address format" },
        { status: 400 }
      );
    }

    const trimmed = String(nickname).trim();
    if (trimmed.length < 2 || trimmed.length > 24) {
      return NextResponse.json(
        { error: "Nickname must be between 2 and 24 characters" },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return NextResponse.json(
        { error: "Nickname can only contain alphanumeric characters, hyphens, and underscores" },
        { status: 400 }
      );
    }

    const user = await saveUser(address, trimmed);
    return NextResponse.json({ success: true, user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

