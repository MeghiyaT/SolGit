import { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  ArrowDownCircle,
  ArrowUpCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  Layers,
  Activity,
  Sliders,
  X,
} from "lucide-react";
import {
  DEFAULT_DIAMOND_ADDRESS,
  VAULT_V1_ADDRESS,
  mstCoralTestnet,
} from "./lib/contracts";

interface TransactionLog {
  id: string;
  type: "deposit" | "withdraw" | "exploit_blocked";
  amount: string;
  timestamp: string;
  txHash: string;
  status: "success" | "reverted" | "blocked";
  note?: string;
}

interface Persona {
  id: "staker" | "attacker" | "injected";
  name: string;
  role: string;
  address: string;
  stakedBalance: number;
  walletBalance: number;
  badge: string;
}

const PRESET_PERSONAS: Persona[] = [
  {
    id: "staker",
    name: "Alice (Verified Staker)",
    role: "Liquidity Provider",
    address: "0x71C8A3d9943B2B4aE40F477f1f99cE83570349A2",
    stakedBalance: 1.5,
    walletBalance: 10.0,
    badge: "Verified Staker",
  },
  {
    id: "attacker",
    name: "Anonymous Wallet (0 Balance)",
    role: "Attacker Simulation",
    address: "0x9dF0C6b0066D5317aA5b38B36850548DaCCa6B4e",
    stakedBalance: 0.0,
    walletBalance: 0.0,
    badge: "Zero Balance",
  },
  {
    id: "injected",
    name: "Injected Web3 Wallet",
    role: "MetaMask / Extension",
    address: "0x0000000000000000000000000000000000000000",
    stakedBalance: 0.0,
    walletBalance: 0.0,
    badge: "Browser Extension",
  },
];

export default function App() {
  const [selectedPersona, setSelectedPersona] = useState<Persona>(PRESET_PERSONAS[0]);
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Protocol Metrics
  const [tvl, setTvl] = useState<number>(15.0);
  const [userStaked, setUserStaked] = useState<number>(1.5);
  const [userWallet, setUserWallet] = useState<number>(10.0);

  // Sync initial state from SolGit Dashboard API if available
  useEffect(() => {
    fetch("http://localhost:3000/api/vault/state")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.tvl === "number") {
          setTvl(data.tvl);
        }
      })
      .catch(() => {});
  }, []);

  // Security Incident Notice State
  const [incidentNotice, setIncidentNotice] = useState<{
    active: boolean;
    txHash: string;
    selector: string;
    reason: string;
    restoredFacet: string;
    timestamp: string;
  } | null>(null);

  // Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [diamondAddress, setDiamondAddress] = useState(DEFAULT_DIAMOND_ADDRESS);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);

  // Activity Feed
  const [activity, setActivity] = useState<TransactionLog[]>([
    {
      id: "tx-init-1",
      type: "deposit",
      amount: "10.000",
      timestamp: "12 mins ago",
      txHash: "0x3e18a892b10f27c3f81e7d9c1248c823619ea81b0a7217db5204481358c21a99",
      status: "success",
      note: "Initial Liquidity Bootstrap",
    },
    {
      id: "tx-init-2",
      type: "deposit",
      amount: "5.000",
      timestamp: "4 mins ago",
      txHash: "0x892a0e882419c836dbf19c08a9f4c71829e018a7b94c029e84a9c812739a1b02",
      status: "success",
      note: "Ecosystem Staking Batch",
    },
  ]);

  // Sync persona balances when switching
  const handleSelectPersona = (p: Persona) => {
    setSelectedPersona(p);
    setUserStaked(p.stakedBalance);
    setUserWallet(p.walletBalance);
    setPersonaDropdownOpen(false);
    if (p.id === "attacker") {
      setActiveTab("withdraw");
      setAmount("200");
    } else {
      setAmount("");
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Connect Injected Browser Wallet
  const connectInjected = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts && accounts[0]) {
          const injectedPersona: Persona = {
            id: "injected",
            name: "Connected Injected Wallet",
            role: "Browser User",
            address: accounts[0],
            stakedBalance: 0.0,
            walletBalance: 5.0,
            badge: "Injected Web3",
          };
          setSelectedPersona(injectedPersona);
          setUserStaked(0.0);
          setUserWallet(5.0);
        }
      } catch (err) {
        console.error("Wallet connection failed", err);
      }
    } else {
      alert("No Web3 wallet extension detected. You can use the built-in demo personas!");
    }
  };

  // Execute Deposit
  const handleDeposit = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      alert("Please enter a valid deposit amount.");
      return;
    }
    if (val > userWallet) {
      alert("Insufficient wallet balance for this deposit.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setUserWallet((prev) => Math.max(0, +(prev - val).toFixed(4)));
      setUserStaked((prev) => +(prev + val).toFixed(4));
      setTvl((prev) => +(prev + val).toFixed(4));

      // Notify SolGit Dashboard
      fetch("http://localhost:3000/api/vault/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deposit", amount: val }),
      }).catch(() => {});

      const newTx: TransactionLog = {
        id: `tx-${Date.now()}`,
        type: "deposit",
        amount: val.toFixed(3),
        timestamp: "Just now",
        txHash: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
        status: "success",
        note: "Native tMSTC Staked",
      };

      setActivity((prev) => [newTx, ...prev]);
      setIsLoading(false);
      setAmount("");
    }, 1200);
  };

  // Execute Withdraw (handles normal withdraw vs. exploit trigger)
  const handleWithdraw = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      alert("Please enter a valid withdrawal amount.");
      return;
    }

    setIsLoading(true);

    // Exploit Trigger Condition:
    // When requesting 200 tMSTC or requesting more than staked balance on an unverified/attacker account
    const isExploitAttempt = val >= 100 || val > userStaked;

    setTimeout(() => {
      setIsLoading(false);

      if (isExploitAttempt) {
        // Exploit Intercepted & Soft-Fail Rollback Triggered!
        const randomTx = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
        
        setIncidentNotice({
          active: true,
          txHash: randomTx,
          selector: "0x2e1a7d4d (withdraw)",
          reason: "SolGitErrors.InvariantBreach('OUTFLOW_CAP')",
          restoredFacet: VAULT_V1_ADDRESS,
          timestamp: new Date().toLocaleTimeString(),
        });

        const blockedTx: TransactionLog = {
          id: `tx-${Date.now()}`,
          type: "exploit_blocked",
          amount: val.toFixed(3),
          timestamp: "Just now",
          txHash: randomTx,
          status: "blocked",
          note: "Guardian Rollback: Unauthorized Drain Intercepted",
        };

        setActivity((prev) => [blockedTx, ...prev]);

        // Notify SolGit Dashboard to trigger autonomous defense telemetry & PR #42
        fetch("http://localhost:3000/api/vault/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "exploit", amount: val }),
        }).catch(() => {});
      } else {
        // Normal legitimate withdrawal within balance
        setUserStaked((prev) => Math.max(0, +(prev - val).toFixed(4)));
        setUserWallet((prev) => +(prev + val).toFixed(4));
        setTvl((prev) => Math.max(0, +(prev - val).toFixed(4)));

        // Notify SolGit Dashboard of capital withdrawal
        fetch("http://localhost:3000/api/vault/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "withdraw", amount: val }),
        }).catch(() => {});

        const successTx: TransactionLog = {
          id: `tx-${Date.now()}`,
          type: "withdraw",
          amount: val.toFixed(3),
          timestamp: "Just now",
          txHash: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
          status: "success",
          note: "Standard Withdrawal",
        };

        setActivity((prev) => [successTx, ...prev]);
        setAmount("");
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-between selection:bg-rose-500/20 selection:text-rose-300">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. Sleek Navigation Bar                                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      <header className="border-b border-white/[0.08] bg-[#0c101a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 shadow-lg shadow-rose-500/25 ring-1 ring-white/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">Coral Vault</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 tracking-wide uppercase">
                  DeFi Staking
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Native Yield Protocol • MST Coral Testnet</p>
            </div>
          </div>

          {/* Right Header: Network status + Demo Personas + Wallet */}
          <div className="flex items-center gap-3">
            {/* Network Chip */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium">MST Coral</span>
              <span className="text-slate-500 font-mono text-[11px]">54635</span>
            </div>

            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs transition cursor-pointer"
              >
                <div className={`w-2 h-2 rounded-full ${selectedPersona.id === "attacker" ? "bg-amber-400" : "bg-cyan-400"}`} />
                <span className="font-semibold text-slate-200">{selectedPersona.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {personaDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50">
                  <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
                    Switch Demo Persona
                  </div>
                  {PRESET_PERSONAS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (p.id === "injected") {
                          connectInjected();
                        } else {
                          handleSelectPersona(p);
                        }
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition flex flex-col gap-0.5 mt-1 cursor-pointer ${
                        selectedPersona.id === p.id
                          ? "bg-rose-500/15 border border-rose-500/30 text-rose-200"
                          : "hover:bg-slate-800/60 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>{p.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {p.badge}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 truncate">
                        {p.address}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Settings Trigger */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/80 text-slate-400 hover:text-slate-200 transition"
              title="Protocol Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. Main Protocol Staking Interface                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
        
        {/* Protocol Hero & Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#0e1322] border border-white/[0.08] relative overflow-hidden group">
            <div className="text-xs text-slate-400 font-medium">Total Value Locked (TVL)</div>
            <div className="text-2xl font-black font-mono text-white mt-1">
              {tvl.toFixed(4)} <span className="text-xs font-sans text-rose-400 font-bold">tMSTC</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <span>● 100% Capital Preserved</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0e1322] border border-white/[0.08]">
            <div className="text-xs text-slate-400 font-medium">Staking Yield</div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
              8.42% <span className="text-xs font-sans text-slate-400 font-bold">APY</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Auto-compounding per block</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0e1322] border border-white/[0.08]">
            <div className="text-xs text-slate-400 font-medium">Proxy Architecture</div>
            <div className="text-sm font-bold text-slate-200 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>EIP-2535 Diamond</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Per-selector soft-fail guard</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0e1322] border border-white/[0.08]">
            <div className="text-xs text-slate-400 font-medium">Permanent Contract</div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono text-xs text-slate-300">
                {diamondAddress.slice(0, 6)}...{diamondAddress.slice(-4)}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopy(diamondAddress, "diamond")}
                  className="p-1 hover:text-white text-slate-400 transition"
                  title="Copy Diamond Address"
                >
                  {copiedKey === "diamond" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={`${mstCoralTestnet.blockExplorers.default.url}/address/${diamondAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 hover:text-white text-slate-400 transition"
                  title="View on MSTScan"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Never changes across updates</div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* CRITICAL REALISTIC PROTOCOL NOTICE (Act 2 & 3 Reaction)        */}
        {/* ───────────────────────────────────────────────────────────── */}
        {incidentNotice && incidentNotice.active && (
          <div className="rounded-2xl border-2 border-rose-500/80 bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/70 p-5 shadow-2xl shadow-rose-950/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0 mt-0.5">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white tracking-wide">
                      ⚠️ Protocol Security Intervention Notice
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold uppercase">
                      Action Blocked
                    </span>
                  </div>
                  
                  {/* The exact blueprint notice narrative */}
                  <p className="text-xs sm:text-sm text-rose-200/90 font-medium leading-relaxed">
                    Function &apos;withdraw&apos; has been restored to stable Version 1 by the contract guardian. Unverified withdrawals are blocked.
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-[11px] font-mono text-slate-300">
                    <div>
                      <span className="text-slate-500">Selector:</span>{" "}
                      <span className="text-rose-300 font-bold">{incidentNotice.selector}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Trigger:</span>{" "}
                      <span className="text-amber-300">{incidentNotice.reason}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Active Facet:</span>{" "}
                      <span className="text-emerald-300 font-bold">VaultV1 (Restored)</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Tx Hash:</span>{" "}
                      <span className="text-slate-300">{incidentNotice.txHash.slice(0, 10)}...</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <a
                  href="http://localhost:3000"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-500/20"
                >
                  <span>Open SolGit Dashboard</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setIncidentNotice(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                  title="Dismiss Notice"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* Core Deposit / Withdraw Interaction Box                      */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="max-w-xl mx-auto rounded-3xl bg-[#0c101a] border border-white/[0.1] p-6 shadow-2xl relative overflow-hidden">
          {/* Top Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900/90 border border-slate-800/80 mb-6">
            <button
              onClick={() => setActiveTab("deposit")}
              className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "deposit"
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>Deposit tMSTC</span>
            </button>
            <button
              onClick={() => setActiveTab("withdraw")}
              className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "withdraw"
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>Withdraw tMSTC</span>
            </button>
          </div>

          {/* Form Content */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{activeTab === "deposit" ? "Amount to Stake" : "Amount to Withdraw"}</span>
              <div className="flex items-center gap-1.5 font-mono">
                <span>Balance:</span>
                <span className="text-slate-200 font-semibold">
                  {activeTab === "deposit" ? `${userWallet.toFixed(4)} tMSTC` : `${userStaked.toFixed(4)} tMSTC`}
                </span>
                <button
                  onClick={() => {
                    if (activeTab === "deposit") {
                      setAmount(userWallet.toString());
                    } else {
                      setAmount(userStaked > 0 ? userStaked.toString() : "200");
                    }
                  }}
                  className="text-rose-400 hover:text-rose-300 font-bold ml-1 cursor-pointer text-[11px]"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Input Field with Token Badge */}
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-[#131929] border border-white/[0.1] focus:border-rose-500/60 rounded-2xl py-4 pl-4 pr-32 text-2xl font-black font-mono text-white outline-none transition placeholder:text-slate-600"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px] font-black">
                  C
                </div>
                <span className="font-bold text-xs text-slate-200">tMSTC</span>
              </div>
            </div>

            {/* Quick Percentage Presets */}
            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  onClick={() => {
                    const base = activeTab === "deposit" ? userWallet : (userStaked > 0 ? userStaked : 200);
                    setAmount((+(base * (pct / 100)).toFixed(4)).toString());
                  }}
                  className="py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  {pct}%
                </button>
              ))}
            </div>

            {/* Action Details Table */}
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/60 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Protocol Fee</span>
                <span className="text-emerald-400 font-mono font-medium">0.00% (Free)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Routing Proxy</span>
                <span className="text-slate-300 font-mono">
                  {diamondAddress.slice(0, 8)}...{diamondAddress.slice(-6)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Target Selector</span>
                <span className="text-cyan-300 font-mono">
                  {activeTab === "deposit" ? "0xd0e30db0 (deposit)" : "0x2e1a7d4d (withdraw)"}
                </span>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              onClick={activeTab === "deposit" ? handleDeposit : handleWithdraw}
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl font-black text-sm tracking-wide transition cursor-pointer shadow-xl flex items-center justify-center gap-2 ${
                isLoading
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:opacity-95 text-white shadow-rose-600/25 active:scale-[0.99]"
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
                  <span>Processing Transaction on MST Coral...</span>
                </>
              ) : activeTab === "deposit" ? (
                <>
                  <ArrowDownCircle className="w-4 h-4" />
                  <span>Deposit & Stake tMSTC</span>
                </>
              ) : (
                <>
                  <ArrowUpCircle className="w-4 h-4" />
                  <span>Withdraw tMSTC</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 3. Live Protocol Audit & Activity Feed                        */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="rounded-3xl bg-[#0c101a] border border-white/[0.08] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">Live Vault Protocol Stream</h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Real-time Block Feed</span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {activity.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      tx.status === "blocked"
                        ? "bg-rose-500/20 text-rose-400"
                        : "bg-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {tx.status === "blocked" ? (
                      <ShieldAlert className="w-4 h-4" />
                    ) : tx.type === "deposit" ? (
                      <ArrowDownCircle className="w-4 h-4" />
                    ) : (
                      <ArrowUpCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200 flex items-center gap-2">
                      <span>{tx.note}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                          tx.status === "blocked"
                            ? "bg-rose-950 text-rose-300 border border-rose-800/60"
                            : "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>{tx.txHash.slice(0, 14)}...</span>
                      <span>•</span>
                      <span>{tx.timestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div
                    className={`font-bold ${
                      tx.status === "blocked" ? "text-rose-400 line-through" : "text-emerald-400"
                    }`}
                  >
                    {tx.type === "deposit" ? "+" : "-"}
                    {tx.amount} tMSTC
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. Settings Modal                                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#0c101a] border border-white/[0.1] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Vault Contract Configuration</h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Permanent Diamond Proxy Address</label>
                <input
                  type="text"
                  value={diamondAddress}
                  onChange={(e) => setDiamondAddress(e.target.value as `0x${string}`)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-white text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">RPC Endpoint</label>
                <input
                  type="text"
                  readOnly
                  value="https://coralrpc.mstblockchain.com"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-slate-400 text-xs cursor-not-allowed"
                />
              </div>
            </div>

            <button
              onClick={() => setIsSettingsOpen(false)}
              className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#080b12] py-4 text-center text-xs text-slate-500 font-medium">
        Coral Vault DeFi • Powered by EIP-2535 Diamond Proxy on MST Coral Testnet
      </footer>
    </div>
  );
}
