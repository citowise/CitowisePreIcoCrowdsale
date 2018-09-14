pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "./TimedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";


contract CitowisePreIcoCrowdsale is Ownable,
                                    Crowdsale,
                                    TimedCrowdsale,
                                    CappedCrowdsale
{
    using SafeMath for uint;

    //  uint256 public beginTime; // = 1537023600; // 2018-09-15 12pm UTC+3;
    //  uint256 public endTime; // = 1539615600; // 2018-10-15 12pm UTC+3;

    uint256 public constant ETHER = 1000000000000000000; // hardcoded 10^18 to avoid futher miscalculations
    uint256 public constant PREICO_HARDCAP_ETH = 19000;  // Pre ICO stage hardcap

    uint256 baseExchangeRate = 3888;

    constructor(uint256 beginTime, uint256 endTime, address walletAddress, address tokenAddress) public
        Crowdsale(
            baseExchangeRate,
            walletAddress,
            ERC20(tokenAddress))
        TimedCrowdsale(
            beginTime,
            endTime)
        CappedCrowdsale(
            PREICO_HARDCAP_ETH.mul(ETHER))
    {

    }

    /**
     * @dev Returns token amoun taken into accoun currently active bonus schema bonus schema
     *   1 day:
     *     amounts > 10 ETH - 50% bonus
     *     amounts < 10 ETH - 40% bonus
     *   1 week:
     *     amounts > 10 ETH - 40% bonus
     *     amounts < 10 ETH - 30% bonus
     *   Rest time:
     *     amounts > 10 ETH - 30% bonus
     *     amounts < 10 ETH - 20% bonus
     * @param weiAmount Value in wei to be converted into tokens
     * @return Number of tokens that can be purchased with the specified _weiAmount
     */
    function _getTokenAmount(uint256 weiAmount)
        internal view returns (uint256)
    {
        uint256 currentBonus = _getCurrentTokenBonus(weiAmount);
        uint256 hundered = 100;
        uint256 tokensAmount = super._getTokenAmount(weiAmount);

        return tokensAmount.mul(hundered.add(currentBonus)).div(hundered);
    }

    function _getCurrentTokenBonus(uint256 weiAmount)
        internal view returns (uint256)
    {
        uint256 bonus = 0;
        uint256 currentTime = block.timestamp;
        uint256 oneDay_seconds = 86400;
        uint256 threshold = 10;
        uint256 oneWeek = 7;

        if (openingTime().add(oneDay_seconds) > currentTime) {
            return weiAmount >= threshold.mul(ETHER) ? 50 : 40;
        } else if (openingTime().add(oneWeek.mul(oneDay_seconds)) > currentTime) {
            return weiAmount >= threshold.mul(ETHER) ? 40 : 30;
        } else {
            return weiAmount >= threshold.mul(ETHER) ? 30 : 20;
        }
    }

    /**
     * @dev Overrides delivery by minting tokens upon purchase.
     * @param beneficiary Token purchaser
     * @param tokenAmount Number of tokens to be minted
     */
    function _deliverTokens(
      address beneficiary,
      uint256 tokenAmount
    )
      internal
    {
      // Potentially dangerous assumption about the type of the token.
      require(token().transfer(beneficiary, tokenAmount));
    }
}
