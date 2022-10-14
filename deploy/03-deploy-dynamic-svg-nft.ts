import fs from "fs"
import { ethers, network } from "hardhat"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { developmentChains, networkConfig } from "../helper-hardhat-config"
import { verify } from "../utils/verify"

module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts, deployments } = hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId: number = network.config.chainId!

  let ethUsdPriceFeedAddress: string
  log("-------------------------------------------")

  if (developmentChains.includes(network.name)) {
    const EthUsdAggregator = await ethers.getContract("MockV3Aggregator")
    ethUsdPriceFeedAddress = EthUsdAggregator.address
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed!
  }

  const lowSVG = fs.readFileSync("./images/dynamicNft/frown.svg", {
    encoding: "utf8",
  })
  const highSVG = fs.readFileSync("./images/dynamicNft/happy.svg", {
    encoding: "utf8",
  })

  const args = [ethUsdPriceFeedAddress, lowSVG, highSVG]

  const dynamicSvgNft = await deploy("DynamicSvgNft", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: networkConfig[chainId]["waitConfirmations"] || 1,
  })
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("Verifying...")
    await verify(dynamicSvgNft.address, args)
  }
  log("-----------------------------------------")
}

module.exports.tags = ["all", "dynamicsvg", "main"]
