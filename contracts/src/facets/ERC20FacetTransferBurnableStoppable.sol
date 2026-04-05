// SPDX-License-Identifier: UNLISENCED
pragma solidity ^0.8.26;

import {ERC20FacetTransferBurnable} from "@odaplatform/da-fact-smartcontracts/contracts/facets/extensions/transferBurnable/ERC20FacetTransferBurnable.sol";
import {StopCodes, LibStopCodes} from "../libraries/LibStopCodes.sol";

contract ERC20FacetTransferBurnableStoppable is ERC20FacetTransferBurnable {
  constructor() {}

  modifier onlyNotStopped(address fromAccount, address toAccount) {
    StopCodes memory senderStopCodes = LibStopCodes._getStopCodes(fromAccount);
    StopCodes memory toStopCodes = LibStopCodes._getStopCodes(toAccount);

    if (_isBurner(toAccount)) {
      require(!senderStopCodes.stopRedemptionFrom, "RSTR0000");
      _;
    } else {
      require(!senderStopCodes.stopTransferFrom, "RSTR0002");
      require(!toStopCodes.stopTransferTo, "RSTR0003");
      _;
    }
  }

  /**
   * @inheritdoc ERC20FacetTransferBurnable
   *
   * @dev MUST revert if to_ stopRedemptionFrom is true when to_ is a burner (burn request)
   * @dev MUST revert if to_ stopTransferTo is true when to_ is not a burner (transfer)
   * @dev MUST revert if msg.sender stopTransferFrom is true when to_ is not a burner (transfer)
   */
  function transfer(
    address to_,
    uint256 amount_
  ) public virtual override onlyNotStopped(msg.sender, to_) returns (bool success_) {
    super.transfer(to_, amount_);
    return true;
  }

  /**
   * @inheritdoc ERC20FacetTransferBurnable
   *
   * @dev MUST revert if msg.sender stopRedemptionFrom is true when to_ is a burner (burn request)
   * @dev MUST revert if msg.sender stopTransferFrom is true when to_ is not a burner (transfer)
   * @dev MUST revert if to_ stopTransferTo is true when to_ is not a burner (transfer)
   */
  function transferFrom(
    address from_,
    address to_,
    uint256 amount_
  ) public virtual override onlyNotStopped(from_, to_) returns (bool success_) {
    super.transferFrom(from_, to_, amount_);
    return true;
  }
}
