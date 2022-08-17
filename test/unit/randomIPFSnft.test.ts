import { developmentChains, networkConfig } from "../../helper-hardhat-config"
import { deployments, network, ethers } from "hardhat"
import { RandomIPFSnft, VRFCoordinatorV2Mock } from "../../typechain-types"
import { assert, expect } from "chai"
import { BigNumber } from "ethers"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("randomIPFSnft Unit Tests", () => {
      let randomIPFSnft: RandomIPFSnft
      let vRFCoordinatorV2Mock: VRFCoordinatorV2Mock
      const chainId: number = network.config.chainId!
      let accounts: SignerWithAddress[]
      let deployer: SignerWithAddress
      let mintFee: BigNumber

      beforeEach(async () => {
        accounts = await ethers.getSigners()
        deployer = accounts[0]

        const deployedContracts = await deployments.fixture(["all"])

        randomIPFSnft = await ethers.getContract("RandomIPFSnft", deployer)
        vRFCoordinatorV2Mock = await ethers.getContract(
          "VRFCoordinatorV2Mock",
          deployer
        )
        mintFee = await randomIPFSnft.getMintFee()
      })

      describe("Random nft constructor", () => {
        it("Initializes the Ranfom ipfs constructor correctly", async () => {
          const tokenCounter = await randomIPFSnft.getTokenCounter()
          assert.equal(tokenCounter.toString(), "0")
          assert.equal(mintFee.toString(), networkConfig[chainId]["mintFee"])
        })
      })

      describe("RandomIPFSnft request nft", () => {
        it("Fails if enough amount is not sent", async () => {
          await expect(randomIPFSnft.requestNFT()).to.be.revertedWith(
            "RandomIPFSnft__NeedMoreETHSent"
          )
        })

        it("Event should be Emitted", async () => {
          await expect(randomIPFSnft.requestNFT({ value: mintFee })).to.be.emit(
            randomIPFSnft,
            "NftRequested"
          )
        })
      })
    })
