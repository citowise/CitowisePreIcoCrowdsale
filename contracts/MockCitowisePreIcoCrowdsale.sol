pragma solidity ^0.4.24;

import "./CitowisePreIcoCrowdsale.sol";


contract MockCitowisePreIcoCrowdsale is CitowisePreIcoCrowdsale {

    function turnBackTime(uint256 secs) external {
        super._turnBackTime(secs);
    }

    constructor(uint256 beginTime, uint256 endTime, address walletAddress, address tokenAddress) public
      CitowisePreIcoCrowdsale(beginTime, endTime, walletAddress, tokenAddress) {}
}
