// SPDX-License-Identifier: MIT License
pragma solidity ^0.8.19;

import "@imtbl/contracts/contracts/allowlist/IOperatorAllowlist.sol";
import {ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";

contract SampleOperatorAllowlist is ERC165, IOperatorAllowlist {
    mapping(address => bool) private _operatorAllowlist;

    function setIsAllowlisted(address _operator, bool _isAllowListed) external {
        _operatorAllowlist[_operator] = _isAllowListed;
    }

    function isAllowlisted(address _target) external view returns (bool) {
        return _operatorAllowlist[_target];
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public pure override returns (bool) {
        return interfaceId == type(IOperatorAllowlist).interfaceId;
    }
}
