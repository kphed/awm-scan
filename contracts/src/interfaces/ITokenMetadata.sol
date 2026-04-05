// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

/**
 * @title Token Metadata Interface
 * @author Kinexys Digital Assets Engineering
 * @notice Simple interface defining all functionalities needed to make a token "burnable"
 * @dev Interface enables token to refer to additional metadata
 */
interface ITokenMetadata {
  /**
   * @notice Event is emitted whenever the metadata is updated
   * @dev MUST trigger when the metadata is updated
   *
   * @param previousMetadata_ previous metadata
   * @param currentMetadata_ updated metadata
   */
  event MetadataUpdated(string previousMetadata_, string currentMetadata_);

  /**
   * @notice Query for the token metadata
   *
   * @return metadata_ metadata of token
   */
  function metadata() external view returns (string memory metadata_);

  /**
   * @notice Update the token metadata
   * @dev The metadata string is often a URI pointer to some off-chain location and is never empty
   *
   * @return success_ status of the metadata update (true/false)
   */
  function setMetadata(string memory _metadata) external returns (bool success_);
}
