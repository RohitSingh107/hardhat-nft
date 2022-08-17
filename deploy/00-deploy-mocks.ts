import { ethers, network } from "hardhat"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { developmentChains, networkConfig } from "../helper-hardhat-config"

const BASE_FEE = ethers.utils.parseEther("0.25")
const GAS_PRICE_LINK = 1e9

const DECIMALS = "18"
const INITIAL_PRICE = ethers.utils.parseUnits("200", "ether")

module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts, deployments } = hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  if (developmentChains.includes(network.name)) {
    log("Local Network Detected! Deploying Mocks...")

    await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      log: true,
      args: [BASE_FEE, GAS_PRICE_LINK],
    })

    await deploy("MockV3Aggregator", {
      contract: "MockV3Aggregator",
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_PRICE],
    })

    log("Mocks deployed!")
    log("--------------------------------------------")
  }
}

module.exports.tags = ["all", "mocks"]
