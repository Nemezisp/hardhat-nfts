const { network } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const {
  storeImages,
  storeTokenUriMetadata,
} = require("../utils/uploadToPinata");

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("2");

const imagesLocation = "./images/random";

const metadataTemplate = {
  name: "",
  description: "",
  image: "",
  attributes: [
    {
      trait_type: "cuteness",
      value: 100,
    },
  ],
};

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let tokenUris = [
    "ipfs://QmdVayD7Y17gD5mHiRjac7UksBrJw1KEWXLBaGhvqts7Jw",
    "ipfs://QmeFVRj44vvmaqUZPvH6h9cGiMoCw4utEHp6dN3dccmnou",
    "ipfs://QmdAyf1i1K2277EkvD6gtPdVyanmUepnJ4TNHseHXGcinB",
  ];

  if (process.env.UPLOAD_TO_PINATA === "true") {
    tokenUris = await handleTokenUris();
  }

  let vrfCoordinatorV2Address, subscriptionId;

  if (developmentChains.includes(network.name)) {
    const vrfCoordinatorV2Mock = await ethers.getContract(
      "VRFCoordinatorV2Mock"
    );
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
    const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
    const transactionReceipt = await transactionResponse.wait(1);
    subscriptionId = transactionReceipt.events[0].args.subId;
    await vrfCoordinatorV2Mock.fundSubscription(
      subscriptionId,
      VRF_SUB_FUND_AMOUNT
    );
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"];
    subscriptionId = networkConfig[chainId]["subscriptionId"];
  }

  const mintFee = networkConfig[chainId]["mintFee"];
  const gasLane = networkConfig[chainId]["gasLane"];
  const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"];

  log("------------------------");

  const args = [
    vrfCoordinatorV2Address,
    gasLane,
    subscriptionId,
    callbackGasLimit,
    tokenUris,
    mintFee,
  ];
  const randomIpfsNFT = await deploy("RandomIpfsNFT", {
    from: deployer,
    args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  log("------------------------");

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(randomIpfsNFT.address, args);
  }

  log("------------------------");
};

async function handleTokenUris() {
  tokenUris = [];

  const { responses, files } = await storeImages(imagesLocation);

  for (imageIndex in responses) {
    let tokenUriMetadata = { ...metadataTemplate };
    tokenUriMetadata.name = files[imageIndex].replace(".png", "");
    tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name}!`;
    tokenUriMetadata.image = `ipfs://${responses[imageIndex].IpfsHash}`;
    console.log(`Uploading ${tokenUriMetadata.name}`);
    const metadataUploadResponse = await storeTokenUriMetadata(
      tokenUriMetadata
    );
    tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`);
  }
  console.log("Token URIs uploaded! They are:");
  console.log(tokenUris);
  return tokenUris;
}

module.exports.tags = ["all", "random", "main"];
