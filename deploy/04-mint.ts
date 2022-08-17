import { ethers, network } from "hardhat"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { developmentChains, networkConfig } from "../helper-hardhat-config"
import { verify } from "../utils/verify"
import {
  BasicNft,
  RandomIPFSnft,
  DynamicSvgNft,
  VRFCoordinatorV2Mock,
} from "../typechain-types"

module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts } = hre
  const { deployer } = await getNamedAccounts()
  const chainId: number = network.config.chainId!

  // Basic Nft
  const basicNft: BasicNft = await ethers.getContract("BasicNft", deployer)
  const basicMintTx = await basicNft.mintNft()
  await basicMintTx.wait(1)
  console.log(`Basic NFT index 0 has tokenUri: ${await basicNft.tokenURI(0)}`)
  console.log("Basic nft minted!")

  // Dynamic SVG NFT
  const highValue = ethers.utils.parseEther("4000")
  const dynamicSvgNft: DynamicSvgNft = await ethers.getContract(
    "DynamicSvgNft",
    deployer
  )
  const dynamicSvgNftMintTx = await dynamicSvgNft.mintNft(highValue.toString())
  await dynamicSvgNftMintTx.wait(1)
  console.log(
    `Dynamic SVG NFT index 0 tokenURI: ${await dynamicSvgNft.tokenURI(0)}`
  )
  console.log("Dynamic nft minted!")

  // Random IPFS nft
  const randomIPFSnft: RandomIPFSnft = await ethers.getContract(
    "RandomIPFSnft",
    deployer
  )
  const mintFee = await randomIPFSnft.getMintFee()
  await new Promise<void>(async (resolve, reject) => {
    setTimeout(resolve, 300000) // 5 minutes
    randomIPFSnft.once("NftMinted", async function () {
      resolve()
    })
    const randomIPFSnftMintTx = await randomIPFSnft.requestNFT({
      value: mintFee.toString(),
    })
    const randomIPFSnftMintTxReceipt = await randomIPFSnftMintTx.wait(1)
    if (developmentChains.includes(network.name)) {
      const requestId =
        randomIPFSnftMintTxReceipt.events![1].args!.requestId.toString()
      const vRFCoordinatorV2Mock: VRFCoordinatorV2Mock =
        await ethers.getContract("VRFCoordinatorV2Mock", deployer)
      await vRFCoordinatorV2Mock.fulfillRandomWords(
        requestId,
        randomIPFSnft.address
      )
    }
  })
  console.log(
    `Random IPFS NFT index 0 tokenURI: ${await randomIPFSnft.tokenURI(0)}`
  )
  console.log("Random nft minted!")
}

module.exports.tags = ["all", "mint"]
