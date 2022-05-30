//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IRewardToken.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract RewardToken is ERC721, Ownable, IRewardToken {
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

    function burn(uint256 tokenId) external override {
        require(msg.sender == owner() || msg.sender == ownerOf(tokenId), "Caller is not the owner of the token or contract");
        _burn(tokenId);
    }

    function mint(address to) external override onlyOwner {
        _mint(to, _tokenIdTracker.current());
        _tokenIdTracker.increment();
    }
}
