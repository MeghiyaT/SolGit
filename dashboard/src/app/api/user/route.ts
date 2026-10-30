import { NextRequest, NextResponse } from "next/server";
import { getUser, saveUser } from "../../../lib/storage";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address query parameter is required" }, { status: 400 });
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

    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 30) {
      return NextResponse.json(
        { error: "Nickname must be between 2 and 30 characters" },
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
