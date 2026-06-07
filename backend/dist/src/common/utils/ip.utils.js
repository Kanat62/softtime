"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isIpInCidr = isIpInCidr;
exports.checkIpInNetworks = checkIpInNetworks;
function ipToUint32(ip) {
    return ip.split('.').reduce((acc, octet) => ((acc << 8) | parseInt(octet, 10)) >>> 0, 0);
}
function isIpInCidr(ip, cidr) {
    if (!cidr.includes('/'))
        return ip === cidr;
    const [network, lenStr] = cidr.split('/');
    const prefixLen = parseInt(lenStr, 10);
    const mask = prefixLen === 0 ? 0 : ((0xffffffff << (32 - prefixLen)) >>> 0);
    return (ipToUint32(ip) & mask) === (ipToUint32(network) & mask);
}
function checkIpInNetworks(ip, networks) {
    return networks.some((n) => isIpInCidr(ip, n.cidr));
}
//# sourceMappingURL=ip.utils.js.map