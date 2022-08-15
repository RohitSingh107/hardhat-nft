import pinataSDK, { PinataPinResponse } from "@pinata/sdk"
import path from "path"
import fs from "fs"

const pinataApiKey = process.env.PINATA_API_KEY
const pinataApiSecret = process.env.PINATA_API_SECRET
const pinata = pinataSDK(pinataApiKey!, pinataApiSecret!)

export async function storeImages(imagesFilePath: string) {
  const fullImagePath = path.resolve(imagesFilePath)
  const files = fs.readdirSync(fullImagePath)
  let responses = []
  console.log("Uploading to IPFS...")
  for (const fileIndex in files) {
    const readableStramForFile = fs.createReadStream(
      `${fullImagePath}/${files[fileIndex]}`
    )
    try {
      const response = await pinata.pinFileToIPFS(readableStramForFile)
      responses.push(response)
    } catch (error) {
      console.log(error)
    }
  }
  return { responses, files }
}

export async function storeTokeUriMetadata(metadata: Object) {
  try {
    const response = await pinata.pinJSONToIPFS(metadata)
    return response
  } catch (error) {
    console.log(error)
  }
  return null
}
// module.exports = { storeImages }
