export const SolGitRouterABI = [
    {
        "type": "constructor",
        "inputs": [
            {
                "name": "registryAddr",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "guardAddr",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "ownerAddr",
                "type": "address",
                "internalType": "address"
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "fallback",
        "stateMutability": "payable"
    },
    {
        "type": "receive",
        "stateMutability": "payable"
    },
    {
        "type": "function",
        "name": "guardExecutor",
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
        "name": "owner",
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
        "name": "registry",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "contract IVersionRegistry"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "event",
        "name": "FeatureRolledBack",
        "inputs": [
            {
                "name": "selector",
                "type": "bytes4",
                "indexed": true,
                "internalType": "bytes4"
            },
            {
                "name": "badVersion",
                "type": "uint32",
                "indexed": false,
                "internalType": "uint32"
            },
            {
                "name": "goodVersion",
                "type": "uint32",
                "indexed": false,
                "internalType": "uint32"
            },
            {
                "name": "caller",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "contextHash",
                "type": "bytes32",
                "indexed": false,
                "internalType": "bytes32"
            }
        ],
        "anonymous": false
    },
    {
        "type": "error",
        "name": "NoStableVersion",
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
        "name": "ReentrancyGuardLocked",
        "inputs": []
    },
    {
        "type": "error",
        "name": "Unauthorized",
        "inputs": []
    },
    {
        "type": "error",
        "name": "ZeroAddress",
        "inputs": []
    }
];
