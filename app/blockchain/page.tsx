import Link from "next/link";

const MODULES = [
  { name: "Multi-Chain Support (100+)", desc: "Connect to Ethereum, Bitcoin, Solana, Polkadot, Avalanche, and 95+ more blockchains with unified APIs." },
  { name: "Layer 2 Scaling Integration", desc: "Native support for Optimism, Arbitrum, zkSync, StarkNet, and all major L2 scaling solutions." },
  { name: "Rollups Support", desc: "Optimistic and ZK rollup deployment tooling with automatic sequencer management and fraud proofs." },
  { name: "Sidechains Support", desc: "Custom sidechain deployment with configurable consensus, validators, and bridge contracts." },
  { name: "Cross-Chain Bridges", desc: "Secure cross-chain asset transfer with multi-sig validation, insurance pools, and bridge monitoring." },
  { name: "Atomic Swaps", desc: "Non-custodial cross-chain atomic swaps using HTLC contracts with automatic route discovery." },
  { name: "Smart Contract Automation", desc: "AI-assisted smart contract development, auditing, deployment, and lifecycle management." },
  { name: "DeFi Empire", desc: "Complete DeFi suite: lending, borrowing, trading, yield farming, and liquidity provision across all chains." },
  { name: "Token Creation (Unlimited)", desc: "No-code token factory supporting ERC-20, ERC-721, ERC-1155, SRC-20, SPL and custom token standards." },
  { name: "NFT Marketplace (Unlimited)", desc: "White-label NFT marketplace with lazy minting, royalty enforcement, and cross-chain listing." },
  { name: "DAO Creation (Automated)", desc: "Deploy fully functional DAOs with governance tokens, voting contracts, treasury management, and proposal systems." },
  { name: "Yield Farming Optimization", desc: "AI-driven yield strategy optimization with auto-compounding, gas optimization, and impermanent loss hedging." },
  { name: "Liquidity Pool Management", desc: "Automated market maker management with concentrated liquidity, dynamic fees, and rebalancing." },
  { name: "Liquidity Farming", desc: "Incentive program management for bootstrapping liquidity with vesting schedules and emissions control." },
  { name: "Staking Automation", desc: "Multi-chain staking management with auto-delegation, reward compounding, and validator selection." },
];

export default function BlockchainPage() {
  return (
    <div style={{ background: "#050510", minHeight: "100vh", color: "#e2e8f0" }}>
      <nav style={{ padding: "16px 24px", borderBottom: "1px solid rgba(234,179,8,0.2)" }}>
        <Link href="/" style={{ color: "#facc15", textDecoration: "none", fontSize: 14 }}>← Back to ZIVO AI</Link>
      </nav>
      <header style={{ padding: "60px 24px 48px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⛓️</div>
        <h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, background: "linear-gradient(135deg, #facc15, #fb923c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 16px" }}>
          Advanced Blockchain Everything
        </h1>
        <p style={{ fontSize: 18, color: "#94a3b8", margin: "0 0 32px", lineHeight: 1.7 }}>
          100+ multi-chain support, Layer 2 scaling, DeFi empire, DAO automation, and yield farming optimization across all blockchains.
        </p>
      </header>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {MODULES.map((mod, i) => (
            <div key={i} style={{ background: "rgba(10,10,30,0.8)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: "0 0 8px" }}>{mod.name}</h3>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>{mod.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
