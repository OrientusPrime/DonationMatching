const matchAmountInput = document.getElementById("matchAmountInput");
const deadlineInput = document.getElementById("deadlineInput");
const poolNameInput = document.getElementById("poolNameInput");
const createPoolBtn = document.getElementById("createPoolBtn");

let isopen = false;

let provider,
  walletAddress,
  usdcContract,
  ourContract,
  accounts,
  contract,
  lastAllowedAmount;

function changeConnectBtnWalletId() {
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
    lastAllowedAmount = (await getAllowance(walletAddress, ourContractAddress)).toNumber();
    updateCreatePoolBtnVisibility();
    loadDonationAddresses();
    if (walletAddress) {
      changeConnectBtnWalletId();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const poolId = urlParams.get("poolId");
    if (poolId) {
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

    isopen = true;
    callback();
  }
}

function updateCreatePoolBtnVisibility() {
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
  let deadline = Number(deadlineDate);
  let today = new Date();
  let diffTime = deadline - today.getTime();
  let diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

  return diffDays;
}


async function loadDonationAddresses() {
  const count = await getDonationAddressCount();
  let options = "";
  for (let i = 0; i < count; i++) {
    const address = await getDonationAddress(i);
    const name = await getDonationAddressName(address);
    options += '<option value="' + i + '">' + name + "</option>";
  }
  document.getElementById("donationAddressSelect").innerHTML = options;
}


async function handleDonateWithMatch(poolId, amount) {
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
    didOpen: () => {
      Swal.showLoading();
    },
  });
  try {
    const tx = await donateWithMatch(poolId, amount);
    await provider.waitForTransaction(tx.hash);
    Swal.fire({
      showCloseButton: true,
      showConfirmButton: false,
      title: "Your donation is successful",
      text: "Thanks for your donation to the " + donatedPoolName + " pool",
      icon: "success",
    });
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
        handleDonateWithMatch(poolId, amount);
      }
    });
  }
}

function searchByUser() {
  if (ourContract === undefined) {
    connect(async function () {
      const searchInput = document.querySelector("#searchInput");
      const searchName = searchInput.value;
      encode(searchName).then((poolId) => {
        window.location.href = "result.html?poolId=" + poolId;
      });
    });
  } else {
    const searchInput = document.querySelector("#searchInput");
    const searchName = searchInput.value;
    encode(searchName).then((poolId) => {
      window.location.href = "result.html?poolId=" + poolId;
    });
  }
}

async function searchOnNewPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const poolId = urlParams.get("poolId");
  const poolName = await getPoolName(poolId);
  const pool = await getPool(poolId);

  if (poolName) {
    const myPoolCard = document.querySelector(`#mypoolcard`);
    myPoolCard.style.display = 'block';

    const poolNameHeader = document.querySelector(".poolname");
    const usdcAmountSpan = document.querySelector(".usdcAmount");
    const matchAmountSpan = document.querySelector(".pooltotalamount");
    const ratioSpan = document.querySelector(".ratio");
    const loaderFront = document.querySelector(".loader-front");
    const remainDaySpan = document.querySelector(".remain-day-span");
    const donationAdressNameSpan = document.querySelector(
      ".donation-adress-name-span"
    );

    const maximumMatch = pool.maximumMatch.toString();
    const currentMatch = pool.currentMatched.toString();
    const poolDeadline = pool.deadline.toString();
    const donationAddress = pool.donationAddress;
    const donationAddressName = await getDonationAddressName(donationAddress);

    let remainTime = calculateDateDifference(poolDeadline);

    let ratio = parseInt(currentMatch) / parseInt(maximumMatch);

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

const searchPoolCard = () => {
  searchByUser(() => {
    searchResultDiv.innerHTML = myPoolCard;
  });
};

async function handleCreatePool(
  matchAmount,
  deadline,
  foundationDonationAdressId,
  name
){
  Swal.fire({
    showCloseButton: true,
    showConfirmButton: false,
    title: "Please confirm Match Amount for creating new pool!",
    text: "Thanks for your support!",
    icon: "info",
    didOpen: () => {
      Swal.showLoading();
    },
  });

  try {
    let pooltx = await createPool(
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
    return pooltx.hash;
  } catch (err) {
    Swal.fire({
      showCloseButton: true,
      showConfirmButton: true,
      title: "Transaction failed!",
      text: "Please try again!",
      icon: "error",
      confirmButtonText: "Try Again",
    }).then((result) => {
      if (result.isConfirmed) {
        handleCreatePool(matchAmount, deadline, foundationDonationAdressId, name);
      }
    });
  }
}

async function checkDonateAmount(event) {
  if (walletAddress === undefined) {
    newConnection();
  } else {
    let poolCard = event.target.closest(".pool-card");
    let donateAmount = Number(poolCard.querySelector(".donateAmountInput").value);
    let allowanceAmount = (await getAllowance(walletAddress, ourContractAddress)).toNumber();
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

const inputElements = document.querySelectorAll(".donateAmountInput");
inputElements.forEach((inputElement) => {
  inputElement.addEventListener("input", checkDonateAmount);
});

async function closePoolWithDonationByUser() {
  const urlParams = new URLSearchParams(window.location.search);
  const poolId = urlParams.get("poolId");
  closePoolWithDonation(poolId);
  console.log(`pool closed with donation`);
}

function closePoolWithWithdrawByUser() {
  const urlParams = new URLSearchParams(window.location.search);
  const poolId = urlParams.get("poolId");
  closePoolWithWithdraw(poolId);
  console.log(`pool closed with donation`);
}

function increaseDeadlineByUser() {
  const urlParams = new URLSearchParams(window.location.search);
  const poolId = urlParams.get("poolId");
  const deadlineInput = document.getElementById("newdeadline");
  let newDeadlineDate = new Date(deadlineInput.value);
  let today = new Date();
  let diffDays = newDeadlineDate.getTime() - today.getTime();

  increaseDeadline(poolId, diffDays);
  console.log(` ${newDeadlineDate} deadline increased`);
}

async function increaseMaxMatchByUser() {
  const urlParams = new URLSearchParams(window.location.search);
  const poolId = urlParams.get("poolId");
  let newMatchAmountInput = Number(document.getElementById("newmatchamount").value);

  let allowanceAmount = (await getAllowance(walletAddress, ourContractAddress)).toNumber();
  let lastAllowedAmount = allowanceAmount;
  if (lastAllowedAmount < newMatchAmountInput) {
    approve(ourContractAddress, newMatchAmountInput);
  } else {
    increaseMaxMatch(poolId, newMatchAmountInput);
    console.log(` ${newMatchAmountInput} amount increased for matching`);
  }
}

async function createNewPoolByUser() {
  if (!isopen) {
    newConnection();
  } else {
    let poolMatchAmount = Number(document.getElementById("matchAmountInput").value);
    let deadlineInput = document.getElementById("deadlineInput");
    let poolDeadLine = new Date(deadlineInput.value).getTime();
    let poolName = document.getElementById("poolNameInput").value;
    let selectedDonationAdress = document.getElementById(
      "donationAddressSelect"
    ).value;

    let foundationDonationAdressId = selectedDonationAdress;
    //ToDo: Foundation Donation Adress Id input olucak

    let allowanceAmount = (await getAllowance(walletAddress, ourContractAddress)).toNumber();
    let lastAllowedAmount = allowanceAmount;
    //1000000 ile çarpmayı unutma
    if (lastAllowedAmount < poolMatchAmount) {
      console.log("createNewPoolByUser lastAllowedAmount < poolMatchAmount, walletAddress: " + walletAddress);
      Swal.fire({
        showCloseButton: true,
        showConfirmButton: false,
        title: "Please confirm and wait for approval request!",
        text: "Your Allowance Amount will increase for creating new pool with your match amount",
        icon: "info",
        didOpen: () => {
          Swal.showLoading();
        },
      });
      try {
        txPool = await approve(ourContractAddress, poolMatchAmount);
        await provider.waitForTransaction(txPool.hash);
        handleCreatePool(
          poolMatchAmount,
          poolDeadLine,
          foundationDonationAdressId,
          poolName
        );
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
            createNewPoolByUser();
          }
        });
      }
    } else {
      console.log(`else Match Amount: ${poolMatchAmount}`);
      console.log(`else Deadline: ${poolDeadLine}`);
      console.log(`else Pool Name: ${poolName}`);
      console.log(`else Allowance: ${lastAllowedAmount}`);
      console.log(`else Match Amount: ${poolMatchAmount}`);
      handleCreatePool(
        poolMatchAmount,
        poolDeadLine,
        foundationDonationAdressId,
        poolName
      );
    }
  }
}

async function displayPoolInfoHelper(poolCard) {
    const poolNameHeader = poolCard.querySelector(".poolname");
    const usdcAmountSpan = poolCard.querySelector(".usdcAmount");
    const matchAmountSpan = poolCard.querySelector(".pooltotalamount");
    const ratioSpan = poolCard.querySelector(".ratio");
    const loaderFront = poolCard.querySelector(".loader-front");
    const remainDaySpan = poolCard.querySelector(".remain-day-span");
    const donationAdressNameSpan = poolCard.querySelector(
      ".donation-adress-name-span"
    );

    const poolName = poolCard.id;
    const poolId = await encode(poolName);
    const pool = await getPool(poolId)
    const currentMatch = pool.currentMatched.toString();
    const maximumMatch = pool.maximumMatch.toString();
    const poolDeadline = pool.deadline.toString();
    const donationAddress = pool.donationAddress;
    const donationAddressName = await getDonationAddressName(donationAddress);
    const remainTime = calculateDateDifference(poolDeadline);
    const ratio = parseInt(currentMatch) / parseInt(maximumMatch);
    const ratioPercent = (ratio * 100).toFixed(2) + "%";
    const cssRatio = Math.floor(ratio * 100) + "%";

    ratioSpan.textContent = ratioPercent;
    usdcAmountSpan.textContent = currentMatch + " USDC";
    matchAmountSpan.textContent = maximumMatch + " USDC";
    loaderFront.style.width = `${cssRatio}`;
    remainDaySpan.textContent = remainTime;
    donationAdressNameSpan.textContent = donationAddressName;
    poolNameHeader.textContent = poolName;
}

async function displayPoolInfo() {
  const poolCards = document.querySelectorAll(".pool-card");
  let promises = [];
  for (const poolCard of poolCards) {
      promises.push(displayPoolInfoHelper(poolCard));
  }
  await Promise.all(promises);
}

document.addEventListener("DOMContentLoaded", function () {
  const poolCards = document.querySelectorAll(".pool-card");
  poolCards.forEach(function (poolCard) {
    const pool = poolCard.querySelector(".poolname");
    pool.addEventListener("click", function () {
      const poolName = poolCard.getAttribute("id");
      encode(poolName).then(function (poolId) {
        window.location.href = "result.html?poolId=" + poolId;
      });
    });
  });
});

const handleDonateClick = async (event) => {
  let poolCard = event.target.closest(".pool-card");
  let poolName = poolCard.id;
  let poolId = await encode(poolName);
  donateAmount = Number(poolCard.querySelector(".donateAmountInput").value);
  if (donateAmount) {
    lastAllowedAmount = (await getAllowance(walletAddress, ourContractAddress)).toNumber();
    const donateButton = poolCard.querySelector(".lets-donate");
    if (lastAllowedAmount < donateAmount) {
      // donateButton.innerHTML = "<span>Approving USDC...<span>";
      Swal.fire({
        showCloseButton: true,
        showConfirmButton: false,
        title: "Please confirm and wait for approval request!",
        text: "Your Allowance Amount will increase for donation",
        icon: "info",
        didOpen: () => {
          Swal.showLoading();
        },
      });
      try {
        let donateApprove = await approve(ourContractAddress, donateAmount);
        const transactionReceipt = await provider.waitForTransaction(
          donateApprove.hash
        );
        console.log("Transaction confirmed:", transactionReceipt);
        await handleDonateWithMatch(poolId, donateAmount);
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
            handleDonateClick(event);
          }
        });
      }
      // lastAllowedAmount = await getAllowance(walletAddress, ourContractAddress);
    } else {
      donateButton.innerHTML =
        '<span class="raised-avax-logo"><i class="usdc-icon"></i></span>Donate<svg xmlns="http://www.w3.org/2000/svg" viewbox="-128 0 512 512" width="1em" height="1em" fill="currentColor"><path d="M64 448c-8.188 0-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L178.8 256L41.38 118.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l160 160c12.5 12.5 12.5 32.75 0 45.25l-160 160C80.38 444.9 72.19 448 64 448z"></path></svg>';
      donateButton.classList.remove("disabled");
      console.log("handleDonateClick calisti");
      await handleDonateWithMatch(poolId, donateAmount);
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
