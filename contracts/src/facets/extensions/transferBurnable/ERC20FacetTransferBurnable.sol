// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ERC20Facet} from "../../ERC20Facet.sol";
import {LibERC20} from "../../../libraries/LibERC20.sol";
import {LibFactBase} from "../../../libraries/LibFactBase.sol";
import {LibBurnRequestable} from "../../../libraries/LibBurnRequestable.sol";
import {LibAccessControl} from "../../../libraries/LibAccessControl.sol";

contract ERC20FacetTransferBurnable is ERC20Facet {
  constructor() {}

  /**
   * @inheritdoc ERC20Facet
   *
   * @notice If to_ is a burner, a burn request along side the transfer
   * @notice Transfers to burner addresses will not check the active status of the to_ account
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if msg.sender balance < amount_
   * @dev MUST revert if token is inactive
   * @dev MUST revert if msg.sender is deactivated
   * @dev MUST revert if to_ is deactivated only if to_ is not a burner
   * @dev MUST revert if msg.sender is the zero address
   * @dev MUST revert if to_ is the zero address
   */
  function transfer(
    address to_,
    uint256 amount_
  ) public virtual override whenNotPaused whenActiveToken onlyActiveAccount(msg.sender) returns (bool success_) {
    if (_isBurner(to_)) {
      bytes32 requestId = _generateBurnRequestId(msg.sender, to_, amount_);
      LibBurnRequestable._createBurnRequest(msg.sender, amount_, requestId, to_);
      LibERC20._transfer(msg.sender, to_, amount_);
    } else {
      super.transfer(to_, amount_);
    }
    return true;
  }

  /**
   * @inheritdoc ERC20Facet
   *
   * @notice If to_ is a burner, a burn request along side the transferFrom
   * @notice Transfers to burner addresses will not check the active status of the to_ account
   * @notice When transfering to burner address, updates allowance, NOT burnAllowance upon successful transferFrom
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if msg.sender allowance for from_ < amount_
   * @dev MUST revert if from_ balance < amount_
   * @dev MUST revert if token is inactive
   * @dev MUST revert if msg.sender is deactivated
   * @dev MUST revert if from_ is deactivated
   * @dev MUST revert if to_ is deactivated only if to_ is not a burner
   * @dev MUST revert if msg.sender is the zero address
   * @dev MUST revert if from_ is the zero address
   * @dev MUST revert if to_ is the zero address
   * @dev MUST update allowance after successful transfer
   */
  function transferFrom(
    address from_,
    address to_,
    uint256 amount_
  )
    public
    virtual
    override
    whenNotPaused
    whenActiveToken
    onlyActiveAccount(from_)
    onlyActiveAccount(msg.sender)
    returns (bool success_)
  {
    if (_isBurner(to_)) {
      LibERC20._spendAllowance(from_, msg.sender, amount_);
      bytes32 requestId = _generateBurnRequestId(from_, to_, amount_);
      LibBurnRequestable._createBurnRequest(from_, amount_, requestId, to_);
      LibERC20._transfer(from_, to_, amount_);
    } else {
      super.transferFrom(from_, to_, amount_);
    }
    return true;
  }

  function _isBurner(address burner) internal view returns (bool) {
    return LibAccessControl._hasRole(LibFactBase.BURNER, burner);
  }

  function _generateBurnRequestId(
    address from_,
    address to_,
    uint256 amount_
  ) internal view returns (bytes32 _requestId) {
    _requestId = keccak256(abi.encodePacked(block.chainid, block.timestamp, address(this), from_, to_, amount_));
  }
}
