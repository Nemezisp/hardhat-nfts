const { developmentChains } = require("../helper-hardhat-config");
const { network } = require("hardhat");

const BASE_FEE = ethers.utils.parseEther("0.25"); // It costs 0.25 LINK per request.
const GAS_PRICE_LINK = 1e9; // Link per gas, doesn't matter for mock
const DECIMALS = "18";
const INITIAL_PRICE = "200000000000000000000";

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const args = [BASE_FEE, GAS_PRICE_LINK];

  if (developmentChains.includes(network.name)) {
    log("Local network detected! Deploying mocks...");
    await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      log: true,
      args,
    });
    await deploy("MockV3Aggregator", {
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_PRICE],
    });
    log("Mocks Deployed!");
    log("---------------------------------");
  }
};

module.exports.tags = ["all", "mocks", "random", "dynamic"];
