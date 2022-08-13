import { network, ethers } from "hardhat"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { developmentChains, networkConfig } from "../helper-hardhat-config"
import { verify } from "../utils/verify"

module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts, deployments } = hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId: number = network.config.chainId!
  //
  log("-------------------------------------------")

  const args: any[] = []
  const waitConfirmations = networkConfig[chainId]["waitConfirmations"] || 1
  console.log(
    `chainid is chainId ${chainId}, deployer is ${deployer}, waitConfirmations is ${waitConfirmations}`
  )
  const basicNft = await deploy("BasicNft", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitConfirmations,
  })

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("Verifying...")
    await verify(basicNft.address, args)
  }
  log("-----------------------------------------")
}

module.exports.tags = ["all", "basicnft"]
