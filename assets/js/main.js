let isopen = false;

let provider,
  walletAddress,
  usdcContract,
  ourContract,
  accounts,
  contract,
  lastAllowedAmount,
  decimal;

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
    if (typeof window.ethereum !== "undefined") {
      lastAllowedAmount = (
        await getAllowance(walletAddress, ourContractAddress)
      ).toNumber();
    }

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
  if (typeof window.ethereum === "undefined") {
    console.log("MetaMask is not installed!");
    const rpcUrl = "https://api.avax-test.network/ext/bc/C/rpc";
    const chainId = 43113;

    provider = new ethers.providers.JsonRpcProvider(rpcUrl, { chainId });
    ourContract = new ethers.Contract(ourContractAddress, abi, provider);
    usdcContract = new ethers.Contract(usdcAddress, usdcABI, provider);
    decimal = Math.pow(10, await getDecimals());
    callback();
  } else {
    provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    provider.on("network", (newNetwork, oldNetwork) => {
      // When a Provider makes its initial connection, it emits a "network"
      // event with a null oldNetwork along with the newNetwork. So, if the
      // oldNetwork exists, it represents a changing network
      if (oldNetwork) {
        window.location.reload();
      }
    });

    accounts = await provider.send("eth_requestAccounts", []);
    const network = await provider.getNetwork();
    const currentNetworkId = await network.chainId;

    if (!(currentNetworkId === AVALANCHE_FUJI_NETWORK_ID)) {
      console.log("trying switch network");
      Swal.fire({
        showCloseButton: false,
        showConfirmButton: false,
        title: "Unsupported Network",
        text: "Please change your dapp browser to Avalanche Fuji Network",
        icon: "error",
        didOpen: () => {
          Swal.showLoading();
        },
        allowOutsideClick: false,
      });
      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xA869" }],
        });
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          try {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0xA869",
                  chainName: "Avalanche Fuji C-Chain",
                  nativeCurrency: {
                    name: "AVAX",
                    symbol: "AVAX", // 2-6 characters long
                    decimals: 18,
                  },
                  rpcUrls: [
                    "https://api.avax-test.network/ext/bc/C/rpc",
                  ] /* ... */,
                  blockExplorerUrls: [
                    "https://testnet.snowtrace.io/",
                  ] /* ... */,
                },
              ],
            });
          } catch (addError) {
            // handle "add" error
          }
        }
        // handle other "switch" errors
      }
      Swal.close();
      //newConnection();
    } else {
      signer = provider.getSigner();
      walletAddress = await signer.getAddress();
      ourContract = new ethers.Contract(ourContractAddress, abi, signer);
      usdcContract = new ethers.Contract(usdcAddress, usdcABI, signer);
      decimal = Math.pow(10, await getDecimals());
      isopen = true;
      callback();
    }
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
  let today = Math.floor(new Date().getTime() / 1000);
  let diffTime = deadline - today;
  let diffDays = Math.ceil(diffTime / ( 60* 60 * 24));

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
  let amountinput = amount / decimal;
  Swal.fire({
    showCloseButton: false,
    showConfirmButton: false,
    title: "Please confirm your generous contribution",
    text:
      "Your donation of " +
      amountinput +
      " USDC will be matched by " +
      donatedPoolName +
      " pool.",
    icon: "info",
    didOpen: () => {
      Swal.showLoading();
    },
    allowOutsideClick: false,
  });
  try {
    const tx = await donateWithMatch(poolId, amount);
    await provider.waitForTransaction(tx.hash);
    Swal.fire({
      showCloseButton: true,
      showConfirmButton: false,
      title: "Your donation is successful",
      text: "Your donation is doubled by " + donatedPoolName + " pool.",
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
    myPoolCard.id = poolName;
    //myPoolCard.style.display = 'block';

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
    usdcAmountSpan.textContent = currentMatch / decimal + " USDC";
    matchAmountSpan.textContent = maximumMatch / decimal + " USDC";
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
) {
  Swal.fire({
    showCloseButton: false,
    showConfirmButton: false,
    title: "Please confirm Match Amount for creating new pool!",
    text: "Thanks for your support!",
    icon: "info",
    didOpen: () => {
      Swal.showLoading();
    },
    allowOutsideClick: false,
  });
  console.log(matchAmount);
  try {
    let pooltx = await createPool(
      matchAmount,
      deadline,
      foundationDonationAdressId,
      name
    );
    await provider.waitForTransaction(pooltx.hash);
    Swal.fire({
      showCloseButton: true,
      showConfirmButton: false,
      title: name + " Pool is created successfully!",
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
        handleCreatePool(
          matchAmount,
          deadline,
          foundationDonationAdressId,
          name
        );
      }
    });
  }
}

async function checkDonateAmount(event) {
  if (walletAddress === undefined) {
    newConnection();
  } else {
    let poolCard = event.target.closest(".pool-card");
    let donateAmount = Number(
      poolCard.querySelector(".donateAmountInput").value
    );
    let allowanceAmount = (
      await getAllowance(walletAddress, ourContractAddress)
    ).toNumber();

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

async function increaseDeadlineByUser() {
  const urlParams = new URLSearchParams(window.location.search);
  const poolId = urlParams.get("poolId");
  const deadlineInput = document.getElementById("newdeadline");
  let newDeadlineDate = Math.floor(new Date(deadlineInput.value).getTime() / 1000);
  let today = Math.floor(new Date().getTime() / 1000);
  const pool =  await getPool(poolId);
  const poolDeadline = pool.deadline;

  const diffDays = newDeadlineDate - poolDeadline;

  increaseDeadline(poolId, diffDays);
  console.log(` ${newDeadlineDate} deadline increased`);
}

async function increaseMaxMatchByUser() {
  const urlParams = new URLSearchParams(window.location.search);
  const poolId = urlParams.get("poolId");

  let newMatchAmountInput =
    Number(document.getElementById("newmatchamount").value) * decimal;

  let allowanceAmount = (
    await getAllowance(walletAddress, ourContractAddress)
  ).toNumber();
  let lastAllowedAmount = allowanceAmount;
  if (lastAllowedAmount < newMatchAmountInput) {
    await approve(ourContractAddress, newMatchAmountInput);
  } else {
    await increaseMaxMatch(poolId, newMatchAmountInput);
    console.log(` ${newMatchAmountInput} amount increased for matching`);
  }
}

async function createNewPoolByUser() {
  if (!isopen) {
    newConnection();
  } else {
    let matchAmount = Number(document.getElementById("matchAmountInput").value);
    let poolMatchAmount = matchAmount * decimal;
    let deadlineInput = document.getElementById("deadlineInput");
    let poolDeadLine = Math.floor(new Date(deadlineInput.value).getTime() / 1000);
    let poolName = document.getElementById("poolNameInput").value;
    let selectedDonationAdress = document.getElementById(
      "donationAddressSelect"
    ).value;
    var amountError = document.getElementById("amount-error");
    var deadlineError = document.getElementById("deadline-error");
    var amount = document.getElementById("matchAmountInput");
    let timenow = Math.floor(new Date().getTime() / 1000);
    if (Number(matchAmount) < 1000) {
      amount.style.border = "1px solid red";
      amountError.style.display = "block";
    } else if(poolDeadLine < timenow + (24 * 60 * 60 * 7)){
      amount.style.border = "0";
      amountError.style.display = "none";
      deadlineError.style.display = "block";
    }
      else {
      amount.style.border = "0";
      amountError.style.display = "none";
      deadlineError.style.display = "none";

      let foundationDonationAdressId = selectedDonationAdress;
      //ToDo: Foundation Donation Adress Id input olucak

      let allowanceAmount = (
        await getAllowance(walletAddress, ourContractAddress)
      ).toNumber();
      let lastAllowedAmount = allowanceAmount;
      //1000000 ile ??arpmay?? unutma
      if (lastAllowedAmount < poolMatchAmount) {
        console.log(
          "createNewPoolByUser lastAllowedAmount < poolMatchAmount, walletAddress: " +
            walletAddress
        );
        Swal.fire({
          showCloseButton: false,
          showConfirmButton: false,
          title: "Please confirm and wait for approval request!",
          text: "Your Allowance Amount will increase for creating new pool with your match amount",
          icon: "info",
          didOpen: () => {
            Swal.showLoading();
          },
          allowOutsideClick: false,
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
        handleCreatePool(
          poolMatchAmount,
          poolDeadLine,
          foundationDonationAdressId,
          poolName
        );
      }
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
  const pool = await getPool(poolId);
  const currentMatch = (pool.currentMatched / decimal).toString();
  const maximumMatch = (pool.maximumMatch / decimal).toString();
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

function updateLoaderWidth(event) {
  console.log("updateLoaderWidth");
  let poolCard = event.target.closest(".pool-card");
  const donateAmountInput = poolCard.querySelector(".donateAmountInput");
  const loaderSecondary = poolCard.querySelector(".loader-secondary");
  const inputValue = donateAmountInput.value * 1000000;
  const poolName = poolCard.getAttribute("id");

  encode(poolName).then(function (poolId) {
    getPool(poolId).then(async function (pool) {
      const maximumMatch = pool.maximumMatch;
      const currentMatch = pool.currentMatched;

      const currentRatio = (currentMatch / maximumMatch) * 100;

      const ratio = (inputValue / maximumMatch) * 100;

      if (currentRatio + ratio <= 100) {
        const cssRatio = Math.floor(currentRatio + ratio) + "%";

        loaderSecondary.style.width = `${cssRatio}`;
      } else {
        loaderSecondary.style.width = "100%";
        donateAmountInput.value = (maximumMatch - currentMatch) / 1000000;
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const poolCards = document.querySelectorAll(".pool-card");

  poolCards.forEach(function (poolCard) {
    const pool = poolCard.querySelector(".poolname");
    const maxAmountBtnPool = poolCard.querySelector(".max-amount-btn");
    const donateAmountInput = poolCard.querySelector(".donateAmountInput");

    maxAmountBtnPool.addEventListener("click", function () {
      const poolName = poolCard.getAttribute("id");
      encode(poolName).then(function (poolId) {
        getPool(poolId).then(async function (pool) {
          const userBalance = await usdcContract.balanceOf(walletAddress);
          const maximumMatch = pool.maximumMatch;
          const currentMatch = pool.currentMatched;
          const abilityMaxDonate = maximumMatch - currentMatch;
          if (userBalance < abilityMaxDonate) {
            donateAmountInput.value = Math.floor(userBalance / decimal);
          } else {
            donateAmountInput.value = Math.floor(abilityMaxDonate / decimal);
          }
          donateAmountInput.dispatchEvent(new Event("input"));
        });
      });
    });

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
  donateAmount =
    Number(poolCard.querySelector(".donateAmountInput").value) * decimal;
  if (donateAmount) {
    lastAllowedAmount = (
      await getAllowance(walletAddress, ourContractAddress)
    ).toNumber();
    const donateButton = poolCard.querySelector(".lets-donate");
    if (lastAllowedAmount < donateAmount) {
      Swal.fire({
        showCloseButton: false,
        showConfirmButton: false,
        title: "Please confirm and wait for approval request!",
        text: "Your Allowance Amount will increase for donation",
        icon: "info",
        didOpen: () => {
          Swal.showLoading();
        },
        allowOutsideClick: false,
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
      title: "Donation amount is not valid!",
      text: "To make a contribution, please enter a valid donation amount.",
      icon: "warning",
    });
  }
};
