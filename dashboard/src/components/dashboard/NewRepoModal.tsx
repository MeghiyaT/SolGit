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
} from "lucide-react";
import type { Repository } from "../../lib/types";

export interface NewRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRepo: (repo: Repository) => void;
  defaultOwner?: string;
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

export function NewRepoModal({
  isOpen,
  onClose,
  onCreateRepo,
  defaultOwner = "mst-protocol",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoName.trim()) return;

    setIsDeploying(true);
    setDeployStep(1);

    // Step 1: Parsing
    setTimeout(() => {
      setDeployStep(2);
      // Step 2: Diamond proxy deployment
      setTimeout(() => {
        setDeployStep(3);
        // Step 3: Guardian hook attachment
        setTimeout(() => {
          setDeployStep(4);
          // Step 4: Completion
          setTimeout(() => {
            const randomHex = Array.from({ length: 40 }, () =>
              Math.floor(Math.random() * 16).toString(16)
            ).join("");
            const newAddress = `0x${randomHex}`;

            const newRepo: Repository = {
              id: `repo-${Date.now()}`,
              name: repoName.trim().toLowerCase().replace(/\s+/g, "-"),
              owner: defaultOwner,
              description:
                description.trim() ||
                "Smart contract diamond proxy deployed on MST Blockchain Testnet.",
              isPrivate,
              updatedAt: "Just now",
              contractAddress: newAddress,
              facetCount: 2,
              guardianActive: true,
            };

            onCreateRepo(newRepo);
            setIsDeploying(false);
            setDeployStep(0);
            onClose();
          }, 600);
        }, 700);
      }, 800);
    }, 700);
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
                Initializes an EIP-2535 Diamond Proxy with active Guardian protection on MST Blockchain
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeploying}
            className="text-[#8b949e] hover:text-[#f0f6fc] p-1 rounded-md transition hover:bg-[#21262d] disabled:opacity-50 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {isDeploying ? (
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
                Deploying behind an EIP-2535 Diamond Proxy on MST Blockchain (Chain ID 91562037)
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
                  2. Deploying Diamond Proxy & initial facets
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
                  3. Attaching SolGit Guardian protection hooks
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                {deployStep >= 4 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-[#30363d] flex-shrink-0" />
                )}
                <span className={deployStep >= 4 ? "text-[#f0f6fc]" : "text-[#8b949e]"}>
                  4. Registering in on-chain VersionRegistry
                </span>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
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
                  className="border-2 border-dashed border-[#30363d] hover:border-emerald-500/50 rounded-lg p-6 text-center cursor-pointer transition bg-[#0d1117] group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".sol"
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Upload className="w-8 h-8 text-[#8b949e] group-hover:text-emerald-400 transition" />
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

            {/* Architecture Banner */}
            <div className="p-3 rounded-lg bg-[#21262d]/60 border border-[#30363d] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#8b949e]">
                <Layers className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Architecture: <strong>EIP-2535 Diamond Proxy</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Shield className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Guardian Active</span>
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
                disabled={!repoName.trim()}
                className="px-3 py-1.5 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium transition shadow-sm border border-[#2ea043]/30 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Create repository & Deploy Diamond</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
