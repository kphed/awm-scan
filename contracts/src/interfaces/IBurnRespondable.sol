// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

/**
 * @title Token Burning Interface
 * @author Kinexys Digital Assets Engineering
 * @notice Simple interface defining all functionalities needed to make a token "burnable"
 * @dev Interface enforces a two-step burn process
 */
interface IBurnRespondable {
  /**
   * @notice Event is emitted whenever some responder approves an existing pending burn request
   * @dev MUST trigger when a request to burn some tokens is approved
   * @param requestId_ id for the request to be approved
   * @param requester_ address to which tokens will be burned
   * @param responder_ address which approves the burn request
   * @param burner_ address to which tokens are transferred to and from which tokens will be burned
   * @param amount_ number of tokens which are burned
   */
  event BurnApproved(
    bytes32 indexed requestId_,
    address indexed requester_,
    address indexed responder_,
    address burner_,
    uint256 amount_
  );

  /**
   * @notice Event is emitted whenever some responder rejects an existing pending burn request
   * @dev MUST trigger when a request to burn some tokens is rejected
   * @param requestId_ id for the request to be rejected
   * @param requester_ address to which tokens would have been burned
   * @param responder_ address which rejects the burn request
   * @param burner_ address to which tokens are transferred to and from which tokens will be burned
   * @param amount_ rejected number of tokens to be burned
   */
  event BurnRejected(
    bytes32 indexed requestId_,
    address indexed requester_,
    address indexed responder_,
    address burner_,
    uint256 amount_
  );

  /**
   * @notice Query for a specific burn request
   * @dev If multiple types of requests are stored together, validate that the request is for "burn"
   * @param requestId_ id for the burn request
   * @param requester_ requester address for the request,
   * @return status_ status of the burn request (pending/approved/rejected)
   * @return responder_ responder address, 0x0 if not yet responded to
   * @return amount_ number of tokens to be burned through this request
   */
  function burnRequestOf(
    bytes32 requestId_,
    address requester_
  ) external returns (uint256 status_, address responder_, uint256 amount_);

  /**
   * @notice Approves a specific request to burn some tokens from some address
   * @dev Implementation must satisfy all pre-checks
   * @param requestId_ id for the request to be approved
   * @param requester_ requester address for the request,
   * @return success_ of the approval of the request to burn (true/false)
   */
  function approveBurn(bytes32 requestId_, address requester_) external returns (bool success_);

  /**
   * @notice Rejects a specific request to burn some tokens some address
   * @dev Implementation must satisfy all pre-checks
   * @param requestId_ id for the request to be rejected
   * @param requester_ requester address for the request,
   * @return success_ status of the rejection of the request to burn (true/false)
   */
  function rejectBurn(bytes32 requestId_, address requester_) external returns (bool success_);
}
