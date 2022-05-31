//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IRewardToken.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title A dummy ERC721 contract
 * @author Deniz Toprak
 * @notice The contract is intended to test StakeForReward
 * @dev It implements IRewardToken interface to comply with StakeForReward
 */
contract RewardToken is ERC721URIStorage, Ownable, IRewardToken {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdTracker;

    string private _baseTokenURI;

    constructor(string memory baseTokenURI) ERC721("RewardToken", "RWT") {
        _baseTokenURI = baseTokenURI;
    }

    /**
     * @dev _beforeTokenTransfer is overriden to restrict transfer to the owner
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override onlyOwner {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    /**
     * @dev Return base URI for computing tokenURI (empty by default in ERC721)
     *      tokenURI = baseURI and the tokenId
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @notice Burn token function restricted to owner
     */
    function burn(uint256 tokenId) external override onlyOwner {
        _burn(tokenId);
    }

    /**
     * @notice Mint token function restricted to owner
     */
    function mint(address to, string memory tokenURI) external override onlyOwner returns (uint256) {
        _tokenIdTracker.increment();
        uint256 newItemId = _tokenIdTracker.current();
        _mint(to, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }
}
