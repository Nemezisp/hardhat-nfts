const { developmentChains } = require("../helper-hardhat-config");
const { network, getNamedAccounts, ethers, deployments } = require("hardhat");
const { assert } = require("chai");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Basic NFT Unit Tests", function () {
      let basicNft, deployer;

      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["basic"]);
        basicNft = await ethers.getContract("BasicNFT", deployer);
      });

      describe("constructor", function () {
        it("initializes the counter correctly", async function () {
          const tokenCounter = await basicNft.getTokenCounter();
          assert.equal(tokenCounter.toString(), "0");
        });
      });

      describe("mint", function () {
        it("mints and increases the counter correctly", async function () {
          const tx = await basicNft.mintNft();
          await tx.wait(1);
          const tokenCounter = await basicNft.getTokenCounter();
          assert.equal(tokenCounter, "1");
          assert.equal(await basicNft.ownerOf(0), deployer);
        });
      });
    });
