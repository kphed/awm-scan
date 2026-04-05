// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

/**
 * @title Token Burning Interface
 * @author Kinexys Digital Assets Engineering
 * @notice Simple interface defining all functionalities needed to make a token "burnable"
 * @dev Interface enforces a single-step burn process
 */
interface IBurnable {
  /**
   * @notice Event is emitted whenever a Tokenization Agent burns tokens from an address
   * @dev MUST trigger when an address burns some tokens
   * @param requestId_ id for the request to be created
   * @param requester_ address for which request is made
   * @param responder_ address of the Tokenization Agent
   * @param amount_ requested number of tokens to be burned
   */
  event Burn(bytes32 indexed requestId_, address indexed requester_, address indexed responder_, uint256 amount_);

  /**
   * @notice Creates a request to burn some from tokens the sender address
   * @dev Implementation must satisfy all pre-checks
   * @param requestId_ id for the request to be created
   * @param requester_ address for which request is made
   * @param amount_ requested number of tokens to be burned
   * @return success_ status of the request to burn (true/false)
   */
  function burn(bytes32 requestId_, address requester_, uint256 amount_) external returns (bool success_);
}
