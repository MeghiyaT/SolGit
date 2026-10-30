import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { deployViaRelayer } from "../../../../lib/relayer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoName, description, solCode, ownerAddress, ownerNickname, isPrivate } = body;

    if (!repoName || !solCode || !ownerAddress) {
      return NextResponse.json(
        { error: "Missing required fields (repoName, ownerAddress, solCode)" },
        { status: 400 }
      );
    }

    if (!isAddress(ownerAddress)) {
      return NextResponse.json(
        { error: "Invalid ownerAddress format" },
        { status: 400 }
      );
    }

    const result = await deployViaRelayer({
      repoName,
      description,
      solCode,
      ownerAddress,
      ownerNickname: ownerNickname || "developer",
      isPrivate: Boolean(isPrivate),
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Deployment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

