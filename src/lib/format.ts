export function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function eipToUrl(eipReference: string) {
  const match = eipReference.match(/EIP-(\d+)/i);

  if (!match) {
    return null;
  }

  return `https://eips.ethereum.org/EIPS/eip-${match[1]}`;
}
