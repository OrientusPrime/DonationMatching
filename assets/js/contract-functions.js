async function getDonationAddressName(address) {
    const name = await ourContract.donationAddressNames(address);
    return name;
}

async function getPoolName(poolId) {
    const myPoolName = await ourContract.poolNames(poolId);
    return myPoolName;
}

async function getDonationAddressCount() {
    const donationAddressCount = await ourContract.donationAddressCount();
    return donationAddressCount;
}

async function getDonationAddress(index) {
    const donationAddress = await ourContract.donationAddresses(index);
    return donationAddress;
}

async function getDonationAddressName(address) {
    const donationAddressName = await ourContract.donationAddressNames(address);
    return donationAddressName;
}

async function encode(name) {
    const encoded = await ourContract.encode(name);
    return encoded;
}

async function getPool(poolId) {
    let pool = await ourContract.pools(poolId);
    return pool;
}

async function donateWithMatch(poolId, amount) {
    const tx = await ourContract.donateWithMatch(poolId, amount);
    console.log(`Transaction hash: ${tx.hash}`);
    return tx;
}

async function createPool(
    matchAmount,
    deadline,
    foundationDonationAdressId,
    name
  ){
    const tx = await ourContract.createPool(
        matchAmount,
        deadline,
        foundationDonationAdressId,
        name
      );
    console.log(`Transaction hash: ${tx.hash}`);
    return tx;
}

async function closePoolWithDonation(poolId) {
    const tx = await ourContract.closePoolWithDonation(poolId);
}

async function closePoolWithWithdraw(poolId) {
    const tx = await ourContract.closePoolWithWithdraw(poolId);
}

async function increaseDeadline(poolId, increaseDeadlineAmount) {
    const tx = await ourContract.increaseDeadline(poolId, increaseDeadlineAmount);
}

async function increaseMaxMatch(poolId, increaseMaxMatchAmount) {
    const tx = await ourContract.increaseMaxMatch(poolId, increaseMaxMatchAmount);
}

async function getAllowance(owner, spender) {
    let myAllowance = await usdcContract.allowance(owner, spender);
    return myAllowance;
}

async function approve(spender, value) {
    let myApprove = await usdcContract.approve(spender, value);
    return myApprove;
}

async function getDecimals() {
    let decimals = await usdcContract.decimals();
    return decimals;
}