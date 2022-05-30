//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IRewardToken is IERC721 {
    function burn(uint256 tokenId) external;

    function mint(address to, string memory tokenURI) external returns (uint256);
}
