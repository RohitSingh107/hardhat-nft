import { HardhatRuntimeEnvironment } from "hardhat/types"
import { VRFCoordinatorV2Mock } from "../typechain-types"
import { developmentChains, networkConfig } from "../helper-hardhat-config"
import { ethers, network } from "hardhat"
import { verify } from "../utils/verify"

import { storeImages, storeTokeUriMetadata } from "../utils/uploadToPinata"

const imagesLocation = "./images/randomNft"

const metadataTemplate = {
  name: "",
  description: "",
  image: "",
  attributes: [
    {
      trait_type: "Cuteness",
      value: "100",
    },
  ],
}

let tokenUris: string[] = [
  "ipfs://QmNgzMdmk2QfYcFDJru6hrzVAif8dFvJ98KijVZhqxVEPB",
  "ipfs://QmVhuk7SmSGv5k6LSh2aF3HSHpTB9NGocLmhg32yq6X1oc",
  "ipfs://QmUwk8R9A42rctULQpRqKHZbNSnnu76ibkg6JxXQhebQRj",
]

const VRF_SUB_FUND_AMOUNT = "1000000000000000000000"

module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts, deployments } = hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId: number = network.config.chainId!

  let vrfCoordinatorV2Address: string | undefined
  let subsciptionId
  // let vRFCoordinatorV2Mock: VRFCoordinatorV2Mock

  if (developmentChains.includes(network.name)) {
    const vRFCoordinatorV2Mock: VRFCoordinatorV2Mock = await ethers.getContract(
      "VRFCoordinatorV2Mock"
    )
    vrfCoordinatorV2Address = vRFCoordinatorV2Mock.address
    const transactionResponse = await vRFCoordinatorV2Mock.createSubscription()
    const transactionReceipt = await transactionResponse.wait(1)
    subsciptionId = transactionReceipt.events![0].args!.subId

    await vRFCoordinatorV2Mock.fundSubscription(
      subsciptionId,
      VRF_SUB_FUND_AMOUNT
    )
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
    subsciptionId = networkConfig[chainId]["subsciptionId"]
  }
  console.log("-------------------------------------")

  const gasLane = networkConfig[chainId]["gasLane"]
  const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
  const mintFee = networkConfig[chainId]["mintFee"]

  if (process.env.UPLOAD_TO_PINATA == "true") {
    tokenUris = await handleTokenUris()
  }

  const args = [
    vrfCoordinatorV2Address,
    subsciptionId,
    gasLane,
    callbackGasLimit,
    tokenUris,
    mintFee,
  ]

  console.log("Deploying RandomIPFSnft Contract...")
  const randomipfs = await deploy("RandomIPFSnft", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: networkConfig[chainId]["waitConfirmations"] || 1,
  })

  // Adding Consumer to vrf
  if (developmentChains.includes(network.name)) {
    const vRFCoordinatorV2Mock = await ethers.getContract(
      "VRFCoordinatorV2Mock"
    )
    await vRFCoordinatorV2Mock.addConsumer(subsciptionId, randomipfs.address)
    log("Consumer is added")
  }

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("Verifying...")
    await verify(randomipfs.address, args)
    log("--------------------------------------------")
  }
}

async function handleTokenUris(): Promise<string[]> {
  let tokenUris: string[] = []

  const { responses, files } = await storeImages(imagesLocation)

  for (const imageUploadResponseIndex in responses) {
    let tokenUriMeta = { ...metadataTemplate }

    tokenUriMeta.name = files[imageUploadResponseIndex].replace(".png", "")
    tokenUriMeta.description = `An adorable ${tokenUriMeta.name} pup!`
    tokenUriMeta.image = `ipfs://${responses[imageUploadResponseIndex].IpfsHash}`
    console.log(`Uploading ${tokenUriMeta.name}...`)
    const metadataUploadResponse = await storeTokeUriMetadata(tokenUriMeta)
    tokenUris.push(`ipfs://${metadataUploadResponse?.IpfsHash}`)
  }
  console.log("Token Uris Uploaded!")
  console.log(tokenUris)

  return tokenUris
}

module.exports.tags = ["all", "randomipfs", "main"]
