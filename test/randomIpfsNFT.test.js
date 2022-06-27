const { developmentChains } = require("../helper-hardhat-config");
const { network, getNamedAccounts, ethers, deployments } = require("hardhat");
const { assert, expect } = require("chai");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Random IPFS NFT Unit Tests", function () {
      let basicNft, deployer;

      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["random"]);
        randomNft = await ethers.getContract("RandomIpfsNFT", deployer);
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
      });

      describe("requestNft", function () {
        it("reverts if paid too low", async function () {
          await expect(randomNft.requestNft()).to.be.revertedWith(
            "RandomIpfsNFT__NeedMoreETHSent"
          );
        });

        it("emits an event when NFT requested", async function () {
          const fee = await randomNft.getMintFee();
          await expect(randomNft.requestNft({ value: fee.toString() })).to.emit(
            randomNft,
            "NFTRequested"
          );
        });
      });

      describe("fulfillRandomWords", function () {
        it("mints NFT after random number returned", async function () {
          await new Promise(async (resolve, reject) => {
            randomNft.once("NFTMinted", async () => {
              try {
                const tokenUri = await randomNft.tokenURI(0);
                const tokenCounter = await randomNft.getTokenCounter();
                assert.equal(tokenUri.toString().includes("ipfs://"), true);
                assert.equal(tokenCounter.toString(), "1");
                assert.equal(await randomNft.ownerOf(0), deployer);
                resolve();
              } catch (error) {
                reject(error);
              }
            });
            try {
              const fee = await randomNft.getMintFee();
              const tx = await randomNft.requestNft({ value: fee.toString() });
              const txReceipt = await tx.wait(1);
              await vrfCoordinatorV2Mock.fulfillRandomWords(
                txReceipt.events[1].args.requestId,
                randomNft.address
              );
            } catch (error) {
              reject(error);
            }
          });
        });
      });
    });
