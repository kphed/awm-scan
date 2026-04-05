// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

/**
 * @title Token Minting Interface
 * @author Kinexys Digital Assets Engineering
 * @notice Simple interface defining all functionalities needed to make a token "mintable"
 * @dev Interface enforces a single-step mint process
 */
interface IMintable {
  /**
   * @notice Event is emitted whenever a Tokenization Agent mints tokens to an address
   * @dev MUST trigger when an address mint some tokens
   * @param requestId_ id for the request to be created
   * @param requester_ address from which mint request is made
   * @param responder_ address of the Tokenization Agent
   * @param amount_ requested number of tokens to be minted
   */
  event Mint(bytes32 indexed requestId_, address indexed requester_, address indexed responder_, uint256 amount_);

  /**
   * @notice Creates a request to mint tokens to the requester address
   * @dev Implementation must satisfy all pre-checks
   * @param requestId_ id for the request to be created
   * @param requester_ address for which request is made
   * @param amount_ requested number of tokens to be minted
   * @return success_ status of the request to mint (true/false)
   */
  function mint(bytes32 requestId_, address requester_, uint256 amount_) external returns (bool success_);
}
