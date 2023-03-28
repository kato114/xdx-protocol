// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "../tokens/MintableBaseToken.sol";

contract XDX is MintableBaseToken {
    constructor() public MintableBaseToken("XDX", "XDX", 0) {
    }

    function id() external pure returns (string memory _name) {
        return "XDX";
    }
}