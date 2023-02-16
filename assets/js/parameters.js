// Define the Ethereum network ID
const ETHEREUM_NETWORK_ID = 1;

// Define the Avalanche network ID
const AVALANCHE_NETWORK_ID = 43114;

// Define the Avalanche fuji network ID
const AVALANCHE_FUJI_NETWORK_ID = 43113;

const usdcAddress = "0x5425890298aed601595a70AB815c96711a31Bc65";
const ourContractAddress = "0x3C46dB75D67e908F4841538047623A7cDabE298c";


const abi = [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "poolId",
          type: "bytes32",
        },
        {
          indexed: false,
          internalType: "uint48",
          name: "newDeadline",
          type: "uint48",
        },
      ],
      name: "DeadlineIncreased",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "uint256",
          name: "donationAddressId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "newDonationAddress",
          type: "address",
        },
      ],
      name: "DonationAddressAdded",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "poolId",
          type: "bytes32",
        },
        {
          indexed: false,
          internalType: "address",
          name: "donor",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "DonationMade",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "poolId",
          type: "bytes32",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "newMaxMatch",
          type: "uint256",
        },
      ],
      name: "MaxMatchIncreased",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "previousOwner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "newOwner",
          type: "address",
        },
      ],
      name: "OwnershipTransferred",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "poolId",
          type: "bytes32",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "remaining",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "recipient",
          type: "address",
        },
      ],
      name: "PoolClosedWithDonation",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "poolId",
          type: "bytes32",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "remaining",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "recipient",
          type: "address",
        },
      ],
      name: "PoolClosedWithWithdraw",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "poolId",
          type: "bytes32",
        },
        {
          indexed: false,
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "maximumMatch",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "deadline",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "string",
          name: "name",
          type: "string",
        },
      ],
      name: "PoolCreated",
      type: "event",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "newDonationAddress",
          type: "address",
        },
        {
          internalType: "string",
          name: "_name",
          type: "string",
        },
      ],
      name: "addDonationAddress",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "poolId",
          type: "bytes32",
        },
      ],
      name: "closePoolWithDonation",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "poolId",
          type: "bytes32",
        },
      ],
      name: "closePoolWithWithdraw",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_maximumMatch",
          type: "uint256",
        },
        {
          internalType: "uint48",
          name: "_deadline",
          type: "uint48",
        },
        {
          internalType: "uint256",
          name: "donationAddressID",
          type: "uint256",
        },
        {
          internalType: "string",
          name: "_name",
          type: "string",
        },
      ],
      name: "createPool",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "poolId",
          type: "bytes32",
        },
        {
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "donateWithMatch",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "poolId",
          type: "bytes32",
        },
        {
          internalType: "uint48",
          name: "increaseAmount",
          type: "uint48",
        },
      ],
      name: "increaseDeadline",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "poolId",
          type: "bytes32",
        },
        {
          internalType: "uint256",
          name: "increaseAmount",
          type: "uint256",
        },
      ],
      name: "increaseMaxMatch",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "renounceOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "newOwner",
          type: "address",
        },
      ],
      name: "transferOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_USDC",
          type: "address",
        },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      inputs: [],
      name: "donationAddressCount",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      name: "donationAddresses",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      name: "donationAddressNames",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "_name",
          type: "string",
        },
      ],
      name: "encode",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32",
        },
      ],
      stateMutability: "pure",
      type: "function",
    },
    {
      inputs: [],
      name: "owner",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32",
        },
      ],
      name: "poolExists",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32",
        },
      ],
      name: "poolNames",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32",
        },
      ],
      name: "pools",
      outputs: [
        {
          internalType: "uint256",
          name: "currentMatched",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "maximumMatch",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          internalType: "uint48",
          name: "deadline",
          type: "uint48",
        },
        {
          internalType: "bool",
          name: "closed",
          type: "bool",
        },
        {
          internalType: "address",
          name: "donationAddress",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "USDC",
      outputs: [
        {
          internalType: "contract IERC20",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];
  
  const usdcABI = [
    {
      constant: true,
      inputs: [
        {
          name: "_owner",
          type: "address",
        },
        {
          name: "_spender",
          type: "address",
        },
      ],
      name: "allowance",
      outputs: [
        {
          name: "",
          type: "uint256",
        },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [
        {
          name: "_spender",
          type: "address",
        },
        {
          name: "_value",
          type: "uint256",
        },
      ],
      name: "approve",
      outputs: [
        {
          name: "",
          type: "bool",
        },
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
  ];