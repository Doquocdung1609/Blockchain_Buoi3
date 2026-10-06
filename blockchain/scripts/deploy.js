const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  if (hre.network.name !== "sepolia") {
    throw new Error("This deployment script is intended for Ethereum Sepolia.");
  }
  if (!process.env.SEPOLIA_RPC_URL || !process.env.PRIVATE_KEY) {
    throw new Error(
      "Missing SEPOLIA_RPC_URL or PRIVATE_KEY. Copy .env.example to .env and fill your test-wallet values."
    );
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying DominionDAO...");
  console.log("Network: Sepolia");
  console.log("Deployer:", deployer.address);

  const DominionDAO = await hre.ethers.getContractFactory("DominionDAO");
  const dao = await DominionDAO.deploy();
  await dao.deployed();

  console.log("DominionDAO deployed to:");
  console.log(dao.address);
  console.log("Transaction:", dao.deployTransaction.hash);

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(deploymentsDir, { recursive: true });
  fs.writeFileSync(
    path.join(deploymentsDir, "sepolia.json"),
    `${JSON.stringify(
      {
        network: "sepolia",
        chainId: 11155111,
        address: dao.address,
        deployer: deployer.address,
        transactionHash: dao.deployTransaction.hash,
        deployedAt: new Date().toISOString(),
      },
      null,
      2
    )}\n`
  );

  require("./sync-abi");
  console.log("ABI synchronized to frontend/src/abis/DominionDAO.json");
  console.log("Set REACT_APP_CONTRACT_ADDRESS=" + dao.address + " in frontend/.env");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});

