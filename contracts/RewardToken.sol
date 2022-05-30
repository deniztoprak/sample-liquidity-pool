//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IRewardToken.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract RewardToken is ERC721URIStorage, Ownable, IRewardToken {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdTracker;

    string private _baseTokenURI;

    constructor(string memory baseTokenURI) ERC721("RewardToken", "RWT") {
        _baseTokenURI = baseTokenURI;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override onlyOwner {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function burn(uint256 tokenId) external override onlyOwner {
        _burn(tokenId);
    }

    function mint(address to, string memory tokenURI) external override onlyOwner returns (uint256) {
        _tokenIdTracker.increment();
        uint256 newItemId = _tokenIdTracker.current();
        _mint(to, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }
}
