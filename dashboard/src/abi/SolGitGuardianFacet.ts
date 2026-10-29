export const SolGitGuardianFacetABI = [
  {
    type: "function",
    name: "emergencyRollback",
    inputs: [
      { name: "_selector", type: "bytes4", internalType: "bytes4" },
      { name: "_targetFacet", type: "address", internalType: "address" },
      { name: "_reason", type: "string", internalType: "string" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "guardian",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "isRegisteredStableFacet",
    inputs: [{ name: "_facet", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "registerStableFacet",
    inputs: [
      { name: "_facet", type: "address", internalType: "address" },
      { name: "_isStable", type: "bool", internalType: "bool" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setGuardian",
    inputs: [{ name: "_guardian", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "event",
    name: "SelectorRolledBack",
    inputs: [
      { name: "selector", type: "bytes4", indexed: true, internalType: "bytes4" },
      { name: "oldFacet", type: "address", indexed: true, internalType: "address" },
      { name: "newFacet", type: "address", indexed: true, internalType: "address" },
      { name: "reason", type: "string", indexed: false, internalType: "string" }
    ],
    anonymous: false
  }
] as const;

