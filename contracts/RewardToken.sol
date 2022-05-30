//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IRewardToken.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract RewardToken is ERC721URIStorage, Ownable, IRewardToken {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdTracker;

    constructor() ERC721("RewardToken", "RWT") {}

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override onlyOwner {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function burn(uint256 tokenId) external override onlyOwner {
        _burn(tokenId);
    }

    function mint(address to, string memory tokenURI) external override onlyOwner returns (uint256) {
        uint256 newItemId = _tokenIdTracker.current();
        _mint(to, newItemId);
        _setTokenURI(newItemId, tokenURI);

        _tokenIdTracker.increment();
        return newItemId;
    }
}
