pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "./TimedCrowdsale.sol";

contract BonusableCrowdsale is Ownable, TimedCrowdsale {

  // Currently active bonus
  uint256 private _currentBonus;

  uint256 private constant ETHER = 1000000000000000000; // hardcoded 10^18 to avoid futher miscalculations

  /**
   * @dev Calculates bonus based on participation amount.
   * @param weiAmount Participation amount in Wei
   * @return tokenAmount Number of tokens to be minted
   */
  function _getCurrentTokenBonus(uint256 weiAmount)
      internal view returns (uint256)
  {
      // It there is currently active bonus take it
      if (_currentBonus > 0) { return _currentBonus; }

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
   * @dev Sets bonus that will override time and volume based bonus schema
   * @param newBonus New bonus that will be active in percents
   * @return Currently active bonus
   */
  function setCurrentBonus(uint256 newBonus)
    public onlyOwner returns (uint256)
  {
      _currentBonus = newBonus;
      return _currentBonus;
  }

  /**
   * @dev Takes away bonus that will override time and volume based bonus schema
   * @return Currently active bonus
   */
  function cancelCurrentBonus()
    public onlyOwner returns (uint256)
  {
    _currentBonus = 0;
    return _currentBonus;
  }
}
