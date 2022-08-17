import { developmentChains } from "../../helper-hardhat-config"
import { deployments, network, ethers } from "hardhat"
import { BasicNft } from "../../typechain-types"
import { assert } from "chai"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("BasicNft Unit tests", () => {
      let basicNft: BasicNft
      const chainId: number = network.config.chainId!
      let deployer: SignerWithAddress

      beforeEach(async () => {
        // const { deployer } = await getNamedAccounts()
        const accounts = await ethers.getSigners()
        deployer = accounts[0]
        await deployments.fixture(["all", "basicnft"])
        basicNft = await ethers.getContract("BasicNft", deployer.address)
      })

      describe("constructor", () => {
        it("Initializes the basicNft contract", async () => {
          const tokenCounter = await basicNft.getTokenCounter()
          const tokenUri = await basicNft.tokenURI(0)

          assert.equal(tokenCounter.toString(), "0")
          assert.equal(
            tokenUri,
            "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json"
          )
        })
      })

      describe("Minting token", async () => {
        it("test the token count after mint", async () => {
          // console.log(basicNft)

          const txResponse = await basicNft.mintNft()
          await txResponse.wait(1)
          const count = await basicNft.getTokenCounter()
          console.log(`count is ${count}`)
          assert.equal(count.toString(), "1")
        })
      })
    })
