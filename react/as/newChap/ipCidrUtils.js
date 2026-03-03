// src/utils/ipCidrUtils.js

const IPV4_REGEX =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

export const isValidIpv4 = (ip) => IPV4_REGEX.test((ip || '').trim());

export const isValidCidr = (cidr) => {
  const v = (cidr || '').trim();
  const [ip, prefix] = v.split('/');
  if (!ip || prefix === undefined) return false;
  if (!isValidIpv4(ip)) return false;

  const p = Number(prefix);
  return Number.isInteger(p) && p >= 0 && p <= 32;
};

// 요구사항: 단일 IP 또는 CIDR만 허용 (~ 대역 미사용)
export const isValidIpOrCidr = (value) => {
  const v = (value || '').trim();
  if (!v) return false;
  return isValidIpv4(v) || isValidCidr(v);
};

export const normalizeIpOrCidr = (value) => (value || '').trim();
