"use client";

import React, { useState, useRef } from "react";
import {
  X,
  BookOpen,
  Lock,
  Globe,
  Upload,
  Shield,
  Layers,
  CheckCircle2,
  Loader2,
  Zap,
  ExternalLink,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import type { Repository } from "../../lib/types";

export interface NewRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRepo: (repo: Repository) => void;
  defaultOwner?: string;
  ownerAddress?: string | null;
}

const DEFAULT_SOLIDITY = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SolGitDiamondFacet
 * @notice Standard EIP-2535 Diamond Facet managed by SolGit Guardian.
 */
contract SolGitDiamondFacet {
    event Executed(address indexed sender, uint256 amount);

    function execute(uint256 amount) external returns (bool) {
        require(amount > 0, "Invalid amount");
        emit Executed(msg.sender, amount);
        return true;
    }

    function getVersion() external pure returns (uint256) {
        return 1;
    }
}
`;

interface RelayerResponse {
  success: boolean;
  contractAddress: string;
  txHash: string;
  txUrl: string;
  explorerUrl: string;
  repository: Repository;
}

export function NewRepoModal({
  isOpen,
  onClose,
  onCreateRepo,
  defaultOwner = "mst-protocol",
  ownerAddress,
}: NewRepoModalProps) {
  const [repoName, setRepoName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [activeTab, setActiveTab] = useState<"file" | "paste">("paste");
  const [solCode, setSolCode] = useState(DEFAULT_SOLIDITY);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Deploying state
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deployResult, setDeployResult] = useState<RelayerResponse | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      if (!repoName) {
        setRepoName(file.name.replace(/\.sol$/, "").toLowerCase());
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) setSolCode(content);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      if (!repoName) {
        setRepoName(file.name.replace(/\.sol$/, "").toLowerCase());
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) setSolCode(content);
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoName.trim() || !solCode.trim()) return;

    if (!ownerAddress) {
      setErrorMessage("Please connect your BridgeKey wallet first to deploy a smart contract repository.");
      return;
    }

    setIsDeploying(true);
    setErrorMessage(null);
    setDeployStep(1);

    try {
      // Step 1: Parsing
      await new Promise((r) => setTimeout(r, 600));
      setDeployStep(2);

      // Step 2: Relayer deployment call
      const res = await fetch("/api/relayer/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoName: repoName.trim(),
          description: description.trim() || "Smart contract diamond proxy deployed on MST Coral Testnet.",
          solCode: solCode.trim(),
          ownerAddress,
          ownerNickname: defaultOwner,
          isPrivate,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Deployment failed with status ${res.status}`);
      }

      const data: RelayerResponse = await res.json();
      setDeployStep(3);
      await new Promise((r) => setTimeout(r, 600));

      setDeployStep(4);
      setDeployResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Deployment failed";
      setErrorMessage(msg);
      setIsDeploying(false);
      setDeployStep(0);
    }
  };

  const handleFinish = () => {
    if (deployResult) {
      onCreateRepo(deployResult.repository);
      setDeployResult(null);
      setIsDeploying(false);
      setDeployStep(0);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-repo-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-[#21262d] text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 id="new-repo-title" className="text-sm font-semibold text-[#f0f6fc]">
                Create a new repository & deploy smart contract
              </h2>
              <p className="text-[11px] text-[#8b949e]">
                Initializes an EIP-2535 Diamond Proxy on MST Coral Testnet (Gasless via SolGit Relayer)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeploying && !deployResult}
            className="text-[#8b949e] hover:text-[#f0f6fc] p-1 rounded-md transition hover:bg-[#21262d] disabled:opacity-50 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {deployResult ? (
          <div className="p-6 space-y-5 text-center">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-[#f0f6fc]">
                Diamond Contract Deployed Successfully!
              </h3>
              <p className="text-xs text-[#8b949e] mt-1">
                Your repository has been persisted and registered on MST Coral Testnet.
              </p>
            </div>

            {/* Relayer Sponsorship Banner */}
            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs text-left">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-emerald-300">Gas Sponsored by SolGit Relayer</span>
                  <p className="text-[11px] text-[#8b949e]">Network Fee: 0.00000 tMSTC (100% Covered)</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                CHAIN ID 54635
              </span>
            </div>

            {/* Contract & TX details */}
            <div className="p-4 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-3 text-left">
              <div>
                <span className="text-[11px] text-[#8b949e] block mb-1">Diamond Contract Address</span>
                <div className="flex items-center justify-between gap-2 bg-[#161b22] px-3 py-1.5 rounded border border-[#30363d]">
                  <span className="font-mono text-xs text-emerald-400 truncate">
                    {deployResult.contractAddress}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(deployResult.contractAddress)}
                      className="text-[#8b949e] hover:text-white p-1 rounded transition"
                      title="Copy Address"
                    >
                      {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={deployResult.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#8b949e] hover:text-emerald-400 p-1 rounded transition"
                      title="View on Explorer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-[#8b949e] block mb-1">Transaction Hash</span>
                <div className="flex items-center justify-between gap-2 bg-[#161b22] px-3 py-1.5 rounded border border-[#30363d]">
                  <span className="font-mono text-xs text-[#c9d1d9] truncate">
                    {deployResult.txHash}
                  </span>
                  <a
                    href={deployResult.txUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#8b949e] hover:text-emerald-400 p-1 rounded transition flex-shrink-0"
                    title="View Transaction"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-2 px-4 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold transition cursor-pointer shadow-sm"
              >
                Go to Repository
              </button>
            </div>
          </div>
        ) : isDeploying ? (
          <div className="p-8 space-y-6 text-center">
            <div className="flex justify-center">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
                <Shield className="w-5 h-5 text-emerald-400 absolute inset-0 m-auto" />
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-[#f0f6fc]">
                Initializing Smart Contract Repository
              </h3>
              <p className="text-xs text-[#8b949e] mt-1">
                Deploying behind an EIP-2535 Diamond Proxy on MST Coral Testnet (Chain ID 54635)
              </p>
            </div>

            {/* Stepper */}
            <div className="max-w-md mx-auto space-y-3 text-left">
              <div className="flex items-center gap-3 text-xs">
                {deployStep > 1 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin flex-shrink-0" />
                )}
                <span className={deployStep >= 1 ? "text-[#f0f6fc]" : "text-[#8b949e]"}>
                  1. Parsing Solidity AST & verifying selectors
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                {deployStep > 2 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : deployStep === 2 ? (
                  <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-[#30363d] flex-shrink-0" />
                )}
                <span className={deployStep >= 2 ? "text-[#f0f6fc]" : "text-[#8b949e]"}>
                  2. Submitting gasless deployment via SolGit Relayer
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                {deployStep > 3 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : deployStep === 3 ? (
                  <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-[#30363d] flex-shrink-0" />
                )}
                <span className={deployStep >= 3 ? "text-[#f0f6fc]" : "text-[#8b949e]"}>
                  3. Attaching SolGit Guardian protection hooks & registry
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                {deployStep >= 4 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-[#30363d] flex-shrink-0" />
                )}
                <span className={deployStep >= 4 ? "text-[#f0f6fc]" : "text-[#8b949e]"}>
                  4. Registering in on-chain VersionRegistry & Supabase
                </span>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold">Deployment Error:</span> {errorMessage}
                </div>
              </div>
            )}

            {/* Owner & Repository Name */}
            <div>
              <label htmlFor="repo-name-input" className="block text-xs font-medium text-[#f0f6fc] mb-1">
                Repository name <span className="text-rose-400">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1.5 rounded-md bg-[#21262d] border border-[#30363d] text-xs text-[#8b949e] font-mono">
                  {defaultOwner} /
                </span>
                <input
                  id="repo-name-input"
                  type="text"
                  required
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="e.g. vault-staking-diamond"
                  className="flex-1 px-3 py-1.5 rounded-md bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] text-xs text-[#f0f6fc] outline-none font-mono"
                />
              </div>
              <p className="text-[11px] text-[#8b949e] mt-1">
                Great repository names are short and memorable. Needs to be unique within your organization.
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="repo-desc-input" className="block text-xs font-medium text-[#f0f6fc] mb-1">
                Description <span className="text-[#8b949e] font-normal">(optional)</span>
              </label>
              <input
                id="repo-desc-input"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this smart contract do?"
                className="w-full px-3 py-1.5 rounded-md bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] text-xs text-[#f0f6fc] outline-none"
              />
            </div>

            {/* Visibility */}
            <div className="border-t border-[#30363d] pt-3">
              <span className="block text-xs font-medium text-[#f0f6fc] mb-2">Visibility</span>
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-2.5 rounded-md bg-[#0d1117] border border-[#30363d] cursor-pointer hover:border-[#8b949e] transition">
                  <input
                    type="radio"
                    name="visibility"
                    checked={!isPrivate}
                    onChange={() => setIsPrivate(false)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#f0f6fc]">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Public</span>
                    </div>
                    <p className="text-[11px] text-[#8b949e] mt-0.5">
                      Anyone on the internet can inspect the contracts, facets, and selector rollbacks.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-md bg-[#0d1117] border border-[#30363d] cursor-pointer hover:border-[#8b949e] transition">
                  <input
                    type="radio"
                    name="visibility"
                    checked={isPrivate}
                    onChange={() => setIsPrivate(true)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#f0f6fc]">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Private</span>
                    </div>
                    <p className="text-[11px] text-[#8b949e] mt-0.5">
                      Only authorized addresses and guardians can view and upgrade facets.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Contract Uploader Section */}
            <div className="border-t border-[#30363d] pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#f0f6fc]">Smart Contract Source</span>
                <div className="flex items-center gap-1 bg-[#0d1117] p-0.5 rounded-md border border-[#30363d]">
                  <button
                    type="button"
                    onClick={() => setActiveTab("paste")}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                      activeTab === "paste"
                        ? "bg-[#21262d] text-white"
                        : "text-[#8b949e] hover:text-[#c9d1d9]"
                    }`}
                  >
                    Paste Solidity
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("file")}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                      activeTab === "file"
                        ? "bg-[#21262d] text-white"
                        : "text-[#8b949e] hover:text-[#c9d1d9]"
                    }`}
                  >
                    Upload .sol
                  </button>
                </div>
              </div>

              {activeTab === "file" ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition bg-[#0d1117] group ${
                    isDragging
                      ? "border-emerald-400 bg-emerald-500/10"
                      : "border-[#30363d] hover:border-emerald-500/50"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".sol"
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Upload
                      className={`w-8 h-8 transition ${
                        isDragging ? "text-emerald-400 scale-110" : "text-[#8b949e] group-hover:text-emerald-400"
                      }`}
                    />
                    <div className="text-xs text-[#f0f6fc]">
                      {uploadedFileName ? (
                        <span className="font-mono text-emerald-400 font-semibold">{uploadedFileName}</span>
                      ) : (
                        <span>Click to browse or drag and drop a <code>.sol</code> file</span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#8b949e]">
                      Supports Solidity 0.8.x contract files
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <textarea
                    rows={8}
                    value={solCode}
                    onChange={(e) => setSolCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] text-xs font-mono text-[#c9d1d9] outline-none leading-relaxed"
                    placeholder="// Paste your Solidity contract code here..."
                  />
                </div>
              )}
            </div>

            {/* Architecture Banner & Gasless Relayer Tag */}
            <div className="p-3 rounded-lg bg-[#21262d]/60 border border-[#30363d] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#8b949e]">
                  <Layers className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Architecture: <strong>EIP-2535 Diamond Proxy</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium">Guardian Active</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[#30363d]/60 text-emerald-400">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Gasless Deployment: <strong>Sponsored by SolGit Relayer</strong></span>
                </div>
                <span className="text-[#8b949e]">Network: MST Coral (54635)</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#30363d]">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-md border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-xs text-[#c9d1d9] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!repoName.trim() || !solCode.trim() || isDeploying}
                className="px-3 py-1.5 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium transition shadow-sm border border-[#2ea043]/30 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Deploy via Relayer (Gasless)</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
