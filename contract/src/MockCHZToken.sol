// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockCHZToken
 * @dev Token CHZ simulé pour les tests
 */
contract MockCHZToken is ERC20 {
    constructor() ERC20("Chiliz", "CHZ") {
        _mint(msg.sender, 1000000000 * 10**decimals()); // 1 milliard de CHZ
    }
    
    /**
     * @dev Mint pour les tests
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
