import OpenAI from "openai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "templates";

  const templates = {
    contracts: [
      { id: "erc20", name: "ERC-20 Token", description: "Fungible token with mint, burn, and transfer", chains: ["ethereum", "polygon", "bsc"] },
      { id: "erc721", name: "ERC-721 NFT", description: "Non-fungible token with metadata and royalties", chains: ["ethereum", "polygon"] },
      { id: "erc1155", name: "ERC-1155 Multi-Token", description: "Gas-efficient multi-token standard", chains: ["ethereum", "polygon", "arbitrum"] },
      { id: "dao", name: "DAO Governance", description: "Governor with timelock, proposals, and voting", chains: ["ethereum"] },
      { id: "staking", name: "Staking Contract", description: "Single-token staking with rewards", chains: ["ethereum", "bsc"] },
      { id: "defi-amm", name: "AMM DEX", description: "Automated market maker with liquidity pools", chains: ["ethereum", "polygon"] },
    ],
    chains: ["ethereum", "polygon", "bsc", "arbitrum", "optimism", "avalanche", "fantom", "base", "zksync", "linea", "scroll", "mantle"],
    wallets: ["MetaMask", "WalletConnect", "Coinbase Wallet", "Rainbow", "Trust Wallet"],
  };

  return NextResponse.json({ ok: true, type, ...templates });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, contractType, description, chain } = body;

    if (!action) {
      return NextResponse.json({ error: "Action required" }, { status: 400 });
    }

    if (action === "generate-contract") {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
      }
      if (!description) {
        return NextResponse.json({ error: "Contract description required" }, { status: 400 });
      }

      const r = await getClient().responses.create({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: "You are a Solidity smart contract expert. Generate secure, gas-optimized Solidity contracts. Return ONLY the Solidity code.",
          },
          {
            role: "user",
            content: `Generate a ${contractType || "smart contract"} in Solidity for: ${description}. Target chain: ${chain || "Ethereum"}.`,
          },
        ],
      });

      const code = (r as any).output_text ?? "";
      return NextResponse.json({
        ok: true,
        action,
        contract: {
          id: `contract-${Date.now()}`,
          type: contractType,
          chain: chain || "ethereum",
          code,
          createdAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ ok: true, action, result: `${action} completed` });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Web3 action failed" }, { status: 500 });
  }
}
