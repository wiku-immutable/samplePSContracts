// SPDX-License-Identifier: MIT License
pragma solidity ^0.8.19;

import "@imtbl/contracts/contracts/token/erc20/preset/ImmutableERC20FixedSupplyNoBurn.sol";

contract SampleImmutableERC20 is ImmutableERC20FixedSupplyNoBurn {
    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        address treasurer,
        address hubOwner
    )
        ImmutableERC20FixedSupplyNoBurn(
            name,
            symbol,
            totalSupply,
            treasurer,
            hubOwner
        )
    {
        // your additional contract logic goes here
    }
}
