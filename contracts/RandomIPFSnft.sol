// SPDX-License-Identifier: GPL3

// import "hardhat/console.sol";

pragma solidity ^0.8.9;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error RandomIPFSnft__RangeOutOfBounds();
error RandomIPFSnft__NeedMoreETHSent();
error RandomIPFSnft__TransferFailed();

contract RandomIPFSnft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
  enum Breed {
    PUB,
    SHIBA_INU,
    ST_BERNARD
  }

  VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
  bytes32 private immutable i_gasLane;
  uint64 private immutable i_subcriptionId;
  uint16 private constant REQUEST_CONFIRMATIONS = 3;
  uint32 private immutable i_callbackGasLimit;
  uint32 private constant NUM_WORDS = 1;

  mapping(uint256 => address) public s_requestIdToSender;
  uint256 public s_tokenCounter;
  uint256 private constant MAX_CHANCE_VALUE = 100;
  string[] internal s_dogTokenUris;
  uint256 private immutable i_mintFee;

  event NftRequested(uint256 indexed requestId, address requester);
  event NftMinted(Breed dogBreed, address minter);

  constructor(
    address vrfCoordinatorV2,
    uint64 subcriptionId,
    bytes32 gasLane,
    uint32 callbackGasLimit,
    string[3] memory dogTokenUris,
    uint256 mintFee
  ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("Random IPFS NFT", "RIN") {
    i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
    i_gasLane = gasLane;
    i_subcriptionId = subcriptionId;
    i_callbackGasLimit = callbackGasLimit;
    s_dogTokenUris = dogTokenUris;
    i_mintFee = mintFee;
  }

  function requestNFT() public payable returns (uint256 requestId) {
    if (msg.value < i_mintFee) {
      revert RandomIPFSnft__NeedMoreETHSent();
    }
    requestId = i_vrfCoordinator.requestRandomWords(
      i_gasLane,
      i_subcriptionId,
      REQUEST_CONFIRMATIONS,
      i_callbackGasLimit,
      NUM_WORDS
    );
    s_requestIdToSender[requestId] = msg.sender;
    emit NftRequested(requestId, msg.sender);
  }

  function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
    internal
    override
  {
    address dogOwner = s_requestIdToSender[requestId];

    uint256 newTokenId = s_tokenCounter;

    uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;

    Breed dogBreed = getBreedFromModdedRng(moddedRng);
    s_tokenCounter += 1;

    _safeMint(dogOwner, newTokenId);
    _setTokenURI(newTokenId, s_dogTokenUris[uint256(dogBreed)]);
    emit NftMinted(dogBreed, dogOwner);
  }

  function withdraw() public onlyOwner {
    uint256 amount = address(this).balance;
    (bool success, ) = payable(msg.sender).call{ value: amount }("");
    if (!success) {
      revert RandomIPFSnft__TransferFailed();
    }
  }

  function getBreedFromModdedRng(uint256 moddedRng)
    public
    pure
    returns (Breed)
  {
    uint256 cumulativeSum = 0;
    uint256[3] memory chanceArray = getChanceArray();

    for (uint256 i = 0; i < chanceArray.length; i++) {
      if (
        moddedRng >= cumulativeSum && moddedRng < cumulativeSum + chanceArray[i]
      ) {
        return Breed(i);
      }
      cumulativeSum += chanceArray[i];
    }
    revert RandomIPFSnft__RangeOutOfBounds();
  }

  function getChanceArray() public pure returns (uint256[3] memory) {
    return [10, 30, MAX_CHANCE_VALUE];
  }

  function getMintFee() public view returns (uint256) {
    return i_mintFee;
  }

  function getTokenCounter() public view returns (uint256) {
    return s_tokenCounter;
  }

  function getDogTokenUris(uint256 index) public view returns (string memory) {
    return s_dogTokenUris[index];
  }
}
