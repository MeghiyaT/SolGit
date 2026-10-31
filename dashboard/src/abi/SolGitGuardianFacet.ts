export const SolGitGuardianFacetABI = [
  {
    "type": "function",
    "name": "emergencyRollback",
    "inputs": [
      {
        "name": "_selector",
        "type": "bytes4",
        "internalType": "bytes4"
      },
      {
        "name": "_targetFacet",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_reason",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "facetSupportsSelector",
    "inputs": [
      {
        "name": "_facet",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_selector",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "guardian",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isRegisteredStableFacet",
    "inputs": [
      {
        "name": "_facet",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "registerStableFacet",
    "inputs": [
      {
        "name": "_facet",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_isStable",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "registerStableFacetWithSelectors",
    "inputs": [
      {
        "name": "_facet",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_selectors",
        "type": "bytes4[]",
        "internalType": "bytes4[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setGuardian",
    "inputs": [
      {
        "name": "_guardian",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setVersionRegistry",
    "inputs": [
      {
        "name": "_versionRegistry",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "versionRegistry",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "GuardianUpdated",
    "inputs": [
      {
        "name": "previousGuardian",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newGuardian",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "GuardianUpdated",
    "inputs": [
      {
        "name": "previousGuardian",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newGuardian",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SelectorRolledBack",
    "inputs": [
      {
        "name": "selector",
        "type": "bytes4",
        "indexed": true,
        "internalType": "bytes4"
      },
      {
        "name": "oldFacet",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newFacet",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "reason",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SelectorRolledBack",
    "inputs": [
      {
        "name": "selector",
        "type": "bytes4",
        "indexed": true,
        "internalType": "bytes4"
      },
      {
        "name": "oldFacet",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newFacet",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "reason",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "StableFacetRegistered",
    "inputs": [
      {
        "name": "facet",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "isStable",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "StableFacetRegistered",
    "inputs": [
      {
        "name": "facet",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "isStable",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "VersionRegistryUpdated",
    "inputs": [
      {
        "name": "previousRegistry",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newRegistry",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "CannotReplaceNonExistentFunction",
    "inputs": [
      {
        "name": "selector",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ]
  },
  {
    "type": "error",
    "name": "CannotReplaceSameFunction",
    "inputs": [
      {
        "name": "selector",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ]
  },
  {
    "type": "error",
    "name": "NotContractOwner",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotGuardian",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TargetFacetDoesNotImplementSelector",
    "inputs": [
      {
        "name": "facet",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "selector",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ]
  },
  {
    "type": "error",
    "name": "TargetFacetNotRegisteredStable",
    "inputs": [
      {
        "name": "facet",
        "type": "address",
        "internalType": "address"
      }
    ]
  }
] as const;
