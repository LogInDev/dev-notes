// src/utils/ipCidrUtils.js

// utils/ipUtils.js

// IPv4(0~255) 정밀 검증
export const isValidIPv4 = (value) => {
  const v = (value || '').trim();
  const parts = v.split('.');
  if (parts.length !== 4) return false;

  for (const p of parts) {
    if (p === '' || !/^\d+$/.test(p)) return false;
    const n = Number(p);
    if (n < 0 || n > 255) return false;
    // 001 같은 것도 허용할지 정책에 따라 다름. 실무에서 보통 허용.
  }
  return true;
};

// CIDR 검증: "x.x.x.x/0~32"
export const isValidIPv4Cidr = (value) => {
  const v = (value || '').trim();
  const [ip, mask] = v.split('/');
  if (!ip || mask === undefined) return false;
  if (!isValidIPv4(ip)) return false;
  if (!/^\d+$/.test(mask)) return false;
  const m = Number(mask);
  return m >= 0 && m <= 32;
};

// 단일 IP 또는 CIDR 허용
export const isValidIpOrCidr = (value) => {
  const v = (value || '').trim();
  if (!v) return false;
  if (v.includes('/')) return isValidIPv4Cidr(v);
  return isValidIPv4(v);
};

// 표준화(대문자화 같은 건 필요 없고, 공백 제거 정도)
export const normalizeIpOrCidr = (value) => (value || '').trim();