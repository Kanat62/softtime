function ipToUint32(ip: string): number {
  return ip.split('.').reduce((acc, octet) => ((acc << 8) | parseInt(octet, 10)) >>> 0, 0);
}

export function isIpInCidr(ip: string, cidr: string): boolean {
  if (!cidr.includes('/')) return ip === cidr;
  const [network, lenStr] = cidr.split('/');
  const prefixLen = parseInt(lenStr, 10);
  const mask = prefixLen === 0 ? 0 : ((0xffffffff << (32 - prefixLen)) >>> 0);
  return (ipToUint32(ip) & mask) === (ipToUint32(network) & mask);
}

/** Returns true if `ip` matches any of the given network CIDRs. */
export function checkIpInNetworks(ip: string, networks: { cidr: string }[]): boolean {
  return networks.some((n) => isIpInCidr(ip, n.cidr));
}
