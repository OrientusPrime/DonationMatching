const usdcAddress = "0x5425890298aed601595a70AB815c96711a31Bc65";
const ourContractAddress = "0x3C46dB75D67e908F4841538047623A7cDabE298c";

const matchAmountInput = document.getElementById("matchAmountInput");
const deadlineInput = document.getElementById("deadlineInput");
const poolNameInput = document.getElementById("poolNameInput");
const createPoolBtn = document.getElementById("createPoolBtn");

// const walletConnectBtn = document.getElementById("walletConnectButton");

let isopen = false;

let provider,
  walletAddress,
  usdcContract,
  ourContract,
  accounts,
  contract,
  lastAllowedAmount;

// Define the Ethereum network ID
const ETHEREUM_NETWORK_ID = 1;

// Define the Avalanche network ID
const AVALANCHE_NETWORK_ID = 43114;

// Define the Avalanche fuji network ID
const AVALANCHE_FUJI_NETWORK_ID = 43113;

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

// window.addEventListener("load", function () {
//   const walletConnectButton = document.querySelector("#walletConnectButton");
//   if (walletConnectButton) {
//     changeConnectBtn();
//   }
// });

// async function changeConnectBtn() {
//   walletConnectButton.innerHTML =
//     'Wallet is conected <i class="metamask-icon"></i>';
// }

async function changeConnectBtnWalletId() {
  let firstFive = walletAddress.substring(0, 4);
  let lastThree = walletAddress.substring(walletAddress.length - 3);
  let shortenedValue = firstFive + "..." + lastThree;
  walletConnectButton.innerHTML =
    "Wallet is connected:" +
    '<span class="walletadresonbtn">' +
    shortenedValue +
    "</span>" +
    '<i class="metamask-icon"></i>';
}

function newConnection() {
  connect(async function () {
    if (walletAddress) {
      changeConnectBtnWalletId();
    }
    let allowanceAmount = await getAllowance(walletAddress, ourContractAddress);
    lastAllowedAmount = allowanceAmount;
    updateCreatePoolBtnVisibility();
    loadDonationAddresses();

    const urlParams = new URLSearchParams(window.location.search);
    const encodedId = urlParams.get("poolId");
    if (encodedId) {
      await searchOnNewPage();
    } else {
      await displayPoolInfo();
    }
  });
}

async function connect(callback) {
  provider = new ethers.providers.Web3Provider(window.ethereum);
  accounts = await provider.send("eth_requestAccounts", []);
  const network = await provider.getNetwork();
  const currentNetworkId = await network.chainId;
  console.log(currentNetworkId);
  if (!(currentNetworkId === AVALANCHE_FUJI_NETWORK_ID)) {
    let alertText =
      "Network Name:\nAvalanche Testnet C-Chain\n\n" +
      "Network URL:\nhttps://api.avax-test.network/ext/bc/C/rpc\n\n" +
      "Network Name:\nAvalanche Testnet C-Chain \n\n" +
      "Chain ID:\n43113 \n\n" +
      "Currency Symbol:\nAVAX \n\n" +
      "Block Explorer URL:\nhttps://testnet.snowtrace.io/ \n";

    Swal.fire({
      showCloseButton: true,
      showConfirmButton: false,
      title: "Please connect to Avalanche Fuji Network",
      html: "<pre>" + alertText + "</pre>",
      customClass: {
        popup: "format-pre",
      },
      icon: "error",
    });

    throw new Error("Unsupported network");
  } else {
    signer = provider.getSigner();
    walletAddress = await signer.getAddress();
    ourContract = new ethers.Contract(ourContractAddress, abi, signer);
    usdcContract = new ethers.Contract(usdcAddress, usdcABI, signer);
    contract = new ethers.Contract(ourContractAddress, abi, signer);

    console.log(accounts);
    console.log(signer);
    console.log(walletAddress);

    isopen = true;
    callback();
  }
}

async function updateCreatePoolBtnVisibility() {
  const createPoolModalBtn = document.getElementById("createPoolModalBtn");
  if (walletAddress === undefined) {
    createPoolModalBtn.style.opacity = ".2";
    createPoolModalBtn.style.pointerEvents = "none";
    createPoolModalBtn.style.cursor = "not-allowed";
  } else {
    createPoolModalBtn.style.opacity = "1";
    createPoolModalBtn.style.pointerEvents = "auto";
    createPoolModalBtn.style.cursor = "pointer";
  }
}

function calculateDateDifference(deadlineDate) {
  let deadline = deadlineDate;
  let today = new Date();

  let diffTime = deadline - today.getTime();
  let diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
  console.log(diffDays);

  return diffDays;
}

async function getDonationAddressName(adress) {
  const name = await ourContract.donationAddressNames(adress);
  return name;
}

async function loadDonationAddresses() {
  const count = await ourContract.donationAddressCount();
  let options = "";
  for (let i = 0; i < count; i++) {
    const adress = await ourContract.donationAddresses(i);
    const name = await ourContract.donationAddressNames(adress);
    options += '<option value="' + i + '">' + name + "</option>";
  }
  document.getElementById("donationAddressSelect").innerHTML = options;
}

async function getPoolName(poolId) {
  const myPoolName = await ourContract.poolNames(poolId);
  console.log("Pool Name: " + myPoolName);
  return await ourContract.poolNames(poolId);
}

async function donateWithMatch(poolId, amount) {
  let donatedPoolName = await getPoolName(poolId);
  Swal.fire({
    showCloseButton: true,
    showConfirmButton: false,
    title: "Please confirm your donation",
    text:
      "your donation will send to " +
      donatedPoolName +
      " pool" +
      " and your donation amount is " +
      amount +
      " USDC",
    icon: "info",
  });
  try {
    const tx = await ourContract.donateWithMatch(poolId, amount);
    await provider.waitForTransaction(tx.hash);
    Swal.fire({
      showCloseButton: true,
      showConfirmButton: false,
      title: "Your donation is successful",
      text: "Thanks for your donation to the " + donatedPoolName + " pool",
      icon: "success",
    });
    console.log(poolId + "Donate Transaction hash: " + tx.hash);
    return tx.hash;
  } catch (error) {
    Swal.fire({
      showCloseButton: true,
      title: "Your donation is failed",
      text: "Please try again",
      icon: "error",
      confirmButtonText: "Try Again",
    }).then((result) => {
      if (result.isConfirmed) {
        donateWithMatch(poolId, amount);
      }
    });
  }
}

// Call the allowance function
async function getAllowance(owner, spender) {
  let myAllowance = await usdcContract.allowance(owner, spender);
  console.log("Allowance: " + myAllowance * 1000000);
  return await myAllowance;
}

// Call the approve function
async function approve(spender, value) {
  let myApprove = usdcContract.approve(spender, value);
  console.log("Approve: " + myApprove);
  return await myApprove;
}

// get the information about a pool with a given poolId
async function getPoolInfo(poolId) {
  let pool = await ourContract.pools(poolId);
  console.log("Pool Info: " + pool);

  let currentMatched = pool.currentMatched.toString();
  let maximumMatch = pool.maximumMatch.toString();
  let owner = pool.owner;
  let deadline = pool.deadline.toString();
  let closed = pool.closed;
  let donationAddress = pool.donationAddress;

  console.log("Current Matched: " + currentMatched);
  console.log("Maximum Match: " + maximumMatch);
  console.log("Owner: " + owner);
  console.log("Deadline: " + deadline);
  console.log("Closed: " + closed);
  console.log("Donation Address: " + donationAddress);
  return [
    await ourContract.pools(poolId),
    currentMatched,
    maximumMatch,
    owner,
    deadline,
    closed,
    donationAddress,
  ];
}

async function encode(name) {
  const encoded = await ourContract.encode(name);
  // console.log("Encoded Name:", encoded);
  return encoded;
}

async function searchByUser() {
  if (ourContract === undefined) {
    connect(async function () {
      const searchInput = document.querySelector("#searchInput");
      const searchName = searchInput.value;
      encode(searchName).then((encodedName) => {
        console.log("Pool ID: " + encodedName);
        window.location.href = "result.html?poolId=" + encodedName;
      });
    });
  } else {
    const searchInput = document.querySelector("#searchInput");
    const searchName = searchInput.value;
    encode(searchName).then((encodedName) => {
      console.log("Pool ID: " + encodedName);
      window.location.href = "result.html?poolId=" + encodedName;
    });
  }
}

async function searchOnNewPage() {
  let searchResultDiv = document.getElementById("search-result-div");

  const urlParams = new URLSearchParams(window.location.search);
  const encodedId = urlParams.get("poolId");
  const poolName = await getPoolName(encodedId);
  const poolInfo = await getPoolInfo(encodedId);

  if (poolName) {
    const myPoolCard = `
       <div id="${poolName}" class="pool-card p-4 neu-shadow">
                <div class="loader-info">
                    <div class="pool-card-header-div-mother">
                        <div class="pool-card-header-div">
                            <h4 class="poolname"> </h4>
                            <div class="remain-day-div"><span class="remain-day-span">x</span><span>days left</span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" fill="currentColor">
                                    <!--! Font Awesome Free 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2022 Fonticons, Inc. -->
                                    <path d="M232 120C232 106.7 242.7 96 256 96C269.3 96 280 106.7 280 120V243.2L365.3 300C376.3 307.4 379.3 322.3 371.1 333.3C364.6 344.3 349.7 347.3 338.7 339.1L242.7 275.1C236 271.5 232 264 232 255.1L232 120zM256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0zM48 256C48 370.9 141.1 464 256 464C370.9 464 464 370.9 464 256C464 141.1 370.9 48 256 48C141.1 48 48 141.1 48 256z"></path>
                                </svg></div>
                        </div>
                        <small class="text-muted" style="font-size: .7rem; margin-top: -.15rem; display: block;">is matching your donations</small>
                        <p><span class="fw-bold donation-adress-name-span">Donation Adress Name</span>&nbsp;is being funded</p>
                    </div>
                    <div class="raised-goadl-div">
                        <div class="raised-with-logo-div"><span class="loader-percentage">Matched<span class="badge bg-white-50 ratio">x%</span></span></div><span class="loader-percentage">Total</span>
                    </div>
                    <div class="loader-bar-mother">
                        <div class="loader-back loader-part">
                            <div class="loader-front loader-part" style="width: 10%;"></div>
                        </div>
                    </div>
                    <div class="raised-goadl-div">
                        <div class="raised-with-logo-div"><span class="loader-percentage usdcAmount">x usdc</span></div><span class="loader-percentage pooltotalamount">x usdc</span>
                    </div>
                    <div class="mt-2 d-flex gap-2 w-100"><input type="number" class="form-control neu-shadow donateAmountInput" placeholder="Amount">
                        <button class="btn go-donation-btn outline lets-donate" type="button" onclick="handleDonateClick(event)" ><span class="raised-avax-logo"><i class="usdc-icon"></i></span>Donate<svg xmlns="http://www.w3.org/2000/svg" viewbox="-128 0 512 512" width="1em" height="1em" fill="currentColor"><path d="M64 448c-8.188 0-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L178.8 256L41.38 118.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l160 160c12.5 12.5 12.5 32.75 0 45.25l-160 160C80.38 444.9 72.19 448 64 448z"></path></svg></button></div>
                </div>
            </div>
  `;
    searchResultDiv.innerHTML = myPoolCard;

    const poolNameHeader = document.querySelector(".poolname");
    const usdcAmountSpan = document.querySelector(".usdcAmount");
    const matchAmountSpan = document.querySelector(".pooltotalamount");
    const ratioSpan = document.querySelector(".ratio");
    const loaderFront = document.querySelector(".loader-front");
    const remainDaySpan = document.querySelector(".remain-day-span");
    const donationAdressNameSpan = document.querySelector(
      ".donation-adress-name-span"
    );

    const maximumMatch = poolInfo[2];
    const currentMatch = poolInfo[1];
    const poolDeadline = poolInfo[4];
    const donationAddress = poolInfo[6];
    const donationAddressName = await getDonationAddressName(donationAddress);

    let remainTime = calculateDateDifference(poolDeadline);

    let ratio = parseInt(currentMatch) / parseInt(maximumMatch);

    console.log(poolName + "ratio=" + ratio);
    let ratioPercent = (ratio * 100).toFixed(2) + "%";
    let cssRatio = Math.floor(ratio * 100) + "%";

    ratioSpan.textContent = ratioPercent;
    usdcAmountSpan.textContent = currentMatch + " USDC";
    matchAmountSpan.textContent = maximumMatch + " USDC";
    loaderFront.style.width = `${cssRatio}`;
    poolNameHeader.textContent = poolName;
    remainDaySpan.textContent = remainTime;
    donationAdressNameSpan.textContent = donationAddressName;
  } else {
    console.error("poolName is undefined");
  }
}

function beforeSearchOnNewPage() {
  connect(async function () {
    searchOnNewPage();
    updateCreatePoolBtnVisibility();
  });
}

function searchPoolCard() {
  searchByUser(async function () {
    searchResultDiv.innerHTML = myPoolCard;
  });
}

async function createPool(
  matchAmount,
  deadline,
  foundationDonationAdressId,
  name
) {
  Swal.fire({
    showCloseButton: true,
    showConfirmButton: false,
    title: "Please confirm Match Amount for creating new pool!",
    text: "Thanks for your support!",
    icon: "info",
  });

  try {
    let pooltx = await ourContract.createPool(
      matchAmount,
      deadline,
      foundationDonationAdressId,
      name
    );
    provider.waitForTransaction(pooltx.hash);
    Swal.fire({
      showCloseButton: true,
      showConfirmButton: false,
      title: name + " pool is created successfully!",
      text: "Thanks for your support!",
      icon: "success",
    });
    console.log(`Transaction hash: ${pooltx.hash}`);
    return pooltx.hash;
  } catch (err) {
    Swal.fire({
      showCloseButton: true,
      showConfirmButton: false,
      title: "Transaction failed!",
      text: "Please try again!",
      icon: "error",
    });
  }
}

// Approve transaction
const approveTransaction = async () => {
  // Code to send the approve transaction
  // Wait for the transaction to be confirmed
  const transactionReceipt = await provider.waitForTransaction(transactionHash);
  console.log("Transaction confirmed:", transactionReceipt);
  let allowanceAmount = await getAllowance(walletAddress, ourContractAddress);
  let lastAllowedAmount = allowanceAmount;
};

async function checkDonateAmount(event) {
  if (walletAddress === undefined) {
    newConnection();
  } else {
    let poolCard = event.target.closest(".pool-card");
    let donateAmount = await poolCard.querySelector(".donateAmountInput").value;
    let allowanceAmount = await getAllowance(walletAddress, ourContractAddress);
    if (allowanceAmount > lastAllowedAmount) {
      lastAllowedAmount = allowanceAmount;
    }

    if (lastAllowedAmount < donateAmount) {
      poolCard.querySelector(".lets-donate").innerHTML = "Approve USDC";
    } else {
      poolCard.querySelector(".lets-donate").innerHTML = "Donate";
    }
  }
}

// async function donateByUser(event) {
//   let poolCard = event.target.closest(".pool-card");
//   let poolCardId = poolCard.id;
//   const encodedId = await encode(poolCardId);
//   console.log("pool card id" + encodedId);

//   let donateAmount = await poolCard.querySelector(".donateAmountInput").value;
//   let lastAllowedAmount = allowanceAmount;

//   if (lastAllowedAmount < donateAmount) {
//     approve(ourContractAddress, donateAmount);
//     poolCard.querySelector(".lets-donate").innerHTML = "Approving USDC...";
//   } else {
//     // Donate action
//     donateWithMatch(encodedId, donateAmount);
//     getPoolInfo(encodedId);
//   }
// }

const inputElements = document.querySelectorAll(".donateAmountInput");
inputElements.forEach((inputElement) => {
  inputElement.addEventListener("input", checkDonateAmount);
});

// Call the closePoolWithDonation function
async function closePoolWithDonation(poolId) {
  const tx = await ourContract.closePoolWithDonation(poolId);
  console.log(`Transaction hash: ${tx.hash}`);
}

async function closePoolWithDonationByUser() {
  const urlParams = new URLSearchParams(window.location.search);
  const poolId = urlParams.get("poolId");
  closePoolWithDonation(poolId);
  console.log(`pool closed with donation`);
}

// Call the closePoolWithWithdraw function
async function closePoolWithWithdraw(poolId) {
  const tx = await ourContract.closePoolWithWithdraw(poolId);
  console.log(`Transaction hash: ${tx.hash}`);
}

async function closePoolWithWithdrawByUser() {
  const urlParams = new URLSearchParams(window.location.search);
  const poolId = urlParams.get("poolId");
  closePoolWithWithdraw(poolId);
  console.log(`pool closed with donation`);
}

// Call the increaseDeadline function
async function increaseDeadline(poolId, increaseDeadlineAmount) {
  const tx = await ourContract.increaseDeadline(poolId, increaseDeadlineAmount);
  console.log(`Transaction hash: ${tx.hash}`);
}

async function increaseDeadlineByUser() {
  const urlParams = new URLSearchParams(window.location.search);
  const encodedName = urlParams.get("poolId");
  const deadlineInput = document.getElementById("newdeadline");
  let newDeadlineDate = new Date(deadlineInput.value);

  let today = new Date();

  let diffDays = newDeadlineDate.getTime() - today.getTime();
  increaseDeadline(encodedName, diffDays);
  console.log(` ${newDeadlineDate} deadline increased`);
}

// Call the increaseMaxMatch function
async function increaseMaxMatch(poolId, increaseMaxMatchAmount) {
  const tx = await ourContract.increaseMaxMatch(poolId, increaseMaxMatchAmount);
  console.log(`Transaction hash: ${tx.hash}`);
}

async function increaseMaxMatchByUser() {
  const urlParams = new URLSearchParams(window.location.search);
  const encodedName = urlParams.get("poolId");
  let newMatchAmountInput = document.getElementById("newmatchamount");

  let allowanceAmount = await getAllowance(walletAddress, ourContractAddress);
  let lastAllowedAmount = allowanceAmount;
  if (lastAllowedAmount < newMatchAmountInput.value) {
    approve(ourContractAddress, newMatchAmountInput.value);
  } else {
    increaseMaxMatch(encodedName, newMatchAmountInput.value);
    console.log(` ${newMatchAmountInput.value} amount increased for matching`);
  }
}

async function createNewPoolByUser() {
  if (!isopen) {
    newConnection();
  } else {
    let poolMatchAmount = document.getElementById("matchAmountInput").value;
    let deadlineInput = document.getElementById("deadlineInput");
    let poolDeadLine = new Date(deadlineInput.value).getTime();
    let poolName = document.getElementById("poolNameInput").value;
    let selectedDonationAdress = document.getElementById(
      "donationAddressSelect"
    ).value;

    let foundationDonationAdressId = selectedDonationAdress;
    //ToDo: Foundation Donation Adress Id input olucak

    let allowanceAmount = await getAllowance(walletAddress, ourContractAddress);
    let lastAllowedAmount = allowanceAmount;
    //1000000 ile çarpmayı unutma
    if (lastAllowedAmount < poolMatchAmount) {
      Swal.fire({
        showCloseButton: true,
        showConfirmButton: false,
        title: "Please confirm and wait approval request!",
        text: "Your Allowance Amount will increase for creating new pool with your match amount",
        icon: "info",
      });
      txPool = await approve(ourContractAddress, poolMatchAmount);
      await provider.waitForTransaction(txPool.hash);
      console.log("ilk if WalletAdress: " + walletAddress);
      console.log(`ilk if Allowance: ${lastAllowedAmount}`);
      console.log(`ilk if Match Amount: ${poolMatchAmount}`);
      createPool(
        poolMatchAmount,
        poolDeadLine,
        foundationDonationAdressId,
        poolName
      );
    } else {
      console.log(`else Match Amount: ${poolMatchAmount}`);
      console.log(`else Deadline: ${poolDeadLine}`);
      console.log(`else Pool Name: ${poolName}`);
      console.log(`else Allowance: ${lastAllowedAmount}`);
      console.log(`else Match Amount: ${poolMatchAmount}`);
      createPool(
        poolMatchAmount,
        poolDeadLine,
        foundationDonationAdressId,
        poolName
      );
    }
  }
}

async function displayPoolInfo() {
  const poolCards = document.querySelectorAll(".pool-card");
  for (const poolCard of poolCards) {
    const poolNameHeader = poolCard.querySelector(".poolname");
    const usdcAmountSpan = poolCard.querySelector(".usdcAmount");
    const matchAmountSpan = poolCard.querySelector(".pooltotalamount");
    const ratioSpan = poolCard.querySelector(".ratio");
    const loaderFront = poolCard.querySelector(".loader-front");
    const remainDaySpan = poolCard.querySelector(".remain-day-span");
    const donationAdressNameSpan = poolCard.querySelector(
      ".donation-adress-name-span"
    );

    const poolId = poolCard.id;

    const encodedId = await encode(poolId);

    const poolName = await getPoolName(encodedId);
    const poolInfo = await getPoolInfo(encodedId);
    const maximumMatch = poolInfo[2];
    const currentMatch = poolInfo[1];
    const poolDeadline = poolInfo[4];
    let donationAddress = poolInfo[6];
    let donationAddressName = await getDonationAddressName(donationAddress);

    let remainTime = calculateDateDifference(poolDeadline);

    let ratio = parseInt(currentMatch) / parseInt(maximumMatch);

    console.log(poolName + "ratio=" + ratio);
    let ratioPercent = (ratio * 100).toFixed(2) + "%";
    let cssRatio = Math.floor(ratio * 100) + "%";

    ratioSpan.textContent = ratioPercent;
    usdcAmountSpan.textContent = currentMatch + " USDC";
    matchAmountSpan.textContent = maximumMatch + " USDC";
    loaderFront.style.width = `${cssRatio}`;
    remainDaySpan.textContent = remainTime;
    donationAdressNameSpan.textContent = donationAddressName;

    poolNameHeader.textContent = poolName;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const poolCards = document.querySelectorAll(".pool-card");
  poolCards.forEach(function (poolCard) {
    const poolName = poolCard.querySelector(".poolname");
    poolName.addEventListener("click", function () {
      const poolId = poolCard.getAttribute("id");
      encode(poolId).then(function (encodedId) {
        window.location.href = "result.html?poolId=" + encodedId;
      });
    });
  });
});

// async function checkAllowedAmount(donateAmount, poolCard) {
//   let poolCardId = poolCard.id;
//   let encodedId = await encode(poolCardId);
//   let allowanceAmount = await getAllowance(walletAddress, ourContractAddress);
//   let lastAllowedAmount = allowanceAmount;
//   if (lastAllowedAmount < donateAmount) {
//     await approve(ourContractAddress, donateAmount);

//     lastAllowedAmount = allowanceAmount;
//     poolCard.querySelector(".lets-donate").classList.remove("disabled");

//     await donateWithMatch(encodedId, donateAmount);

//     poolCard.querySelector(".lets-donate").innerHTML =
//       '<span class="raised-avax-logo"><i class="usdc-icon"></i></span>Donate<svg xmlns="http://www.w3.org/2000/svg" viewbox="-128 0 512 512" width="1em" height="1em" fill="currentColor"><path d="M64 448c-8.188 0-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L178.8 256L41.38 118.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l160 160c12.5 12.5 12.5 32.75 0 45.25l-160 160C80.38 444.9 72.19 448 64 448z"></path></svg>';
//   } else {
//     await donateWithMatch(encodedId, donateAmount);
//     poolCard.querySelector(".lets-donate").innerHTML =
//       '<span class="raised-avax-logo"><i class="usdc-icon"></i></span>Donate<svg xmlns="http://www.w3.org/2000/svg" viewbox="-128 0 512 512" width="1em" height="1em" fill="currentColor"><path d="M64 448c-8.188 0-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L178.8 256L41.38 118.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l160 160c12.5 12.5 12.5 32.75 0 45.25l-160 160C80.38 444.9 72.19 448 64 448z"></path></svg>';
//   }
// }

const handleDonateClick = async (event) => {
  let poolCard = event.target.closest(".pool-card");
  let poolCardId = poolCard.id;
  let encodedId = await encode(poolCardId);
  console.log("pool card id" + encodedId);
  donateAmount = poolCard.querySelector(".donateAmountInput").value;
  if (donateAmount) {
    lastAllowedAmount = await getAllowance(walletAddress, ourContractAddress);
    const donateButton = poolCard.querySelector(".lets-donate");

    if (lastAllowedAmount < donateAmount) {
      // donateButton.innerHTML = "<span>Approving USDC...<span>";
      Swal.fire({
        showCloseButton: true,
        showConfirmButton: false,
        title: "Please confirm and wait approval request!",
        text: "Your Allowance Amount will increase for donation",
        icon: "info",
      });
      donateButton.classList.add("disabled");
      try {
        let donateApprove = await approve(ourContractAddress, donateAmount);
        const transactionReceipt = await provider.waitForTransaction(
          donateApprove.hash
        );
        console.log("Transaction confirmed:", transactionReceipt);
      } catch (err) {
        await Swal.fire({
          showCloseButton: true,
          showConfirmButton: true,
          title: "Error!",
          text: "Approve transaction failed",
          icon: "error",
          confirmButtonText: "Try Again",
        }).then(async (result) => {
          if (result.isConfirmed) {
            Swal.fire({
              showCloseButton: true,
              showConfirmButton: false,
              title: "Please confirm and wait approval request!",
              text: "Your Allowance Amount will increase for donation",
              icon: "info",
            });
            let donateApprove = await approve(ourContractAddress, donateAmount);
            const transactionReceipt = await provider.waitForTransaction(
              donateApprove.hash
            );
            console.log("Transaction confirmed:", transactionReceipt);
          }
        });
      }
      // lastAllowedAmount = await getAllowance(walletAddress, ourContractAddress);
      await donateWithMatch(encodedId, donateAmount);
      donateButton.classList.remove("disabled");
    } else {
      donateButton.innerHTML =
        '<span class="raised-avax-logo"><i class="usdc-icon"></i></span>Donate<svg xmlns="http://www.w3.org/2000/svg" viewbox="-128 0 512 512" width="1em" height="1em" fill="currentColor"><path d="M64 448c-8.188 0-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L178.8 256L41.38 118.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l160 160c12.5 12.5 12.5 32.75 0 45.25l-160 160C80.38 444.9 72.19 448 64 448z"></path></svg>';
      donateButton.classList.remove("disabled");
      console.log("handleDonateClick çalıştı");
      await donateWithMatch(encodedId, donateAmount);
    }
  } else {
    Swal.fire({
      showCloseButton: true,
      showConfirmButton: false,
      title: "Donation amount can't be 0!",
      text: "if you want to make a donation, please enter a donation amount",
      icon: "warning",
      confirmButtonText: "Oh! Okay...",
    });
  }
};
