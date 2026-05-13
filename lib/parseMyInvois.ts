export interface ParsedQR {
  uuid: string;
  validationUrl: string;
  isMyInvois: boolean;
}

export function parseMyInvoisQR(payload: string): ParsedQR {
  const trimmed = payload.trim();

  const urlMatch = trimmed.match(/myinvois\.hasil\.gov\.my\/(?:share\/)?([A-Za-z0-9-]+)/i);
  if (urlMatch) {
    return { uuid: urlMatch[1], validationUrl: trimmed, isMyInvois: true };
  }

  try {
    const u = new URL(trimmed);
    const segments = u.pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      return { uuid: segments[segments.length - 1], validationUrl: trimmed, isMyInvois: false };
    }
  } catch {}

  return {
    uuid: trimmed,
    validationUrl: `https://myinvois.hasil.gov.my/${trimmed}`,
    isMyInvois: false,
  };
}
