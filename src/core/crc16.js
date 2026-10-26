// @ts-check
// CRC-16/XMODEM (polynomial 0x1021, start 0). Used by Stellar and TON address checksums.

/**
 * @param {ArrayLike<number>} bytes
 * @returns {number} 16-bit checksum
 */
export function crc16Xmodem(bytes) {
  let crc = 0;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i] << 8;
    for (let k = 0; k < 8; k++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc;
}
