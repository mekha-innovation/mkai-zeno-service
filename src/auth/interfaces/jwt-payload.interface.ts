export interface JwtPayload {
  email: string;
  sub: string; // หรือ id ของ user
  exp: number;
  iat: number;
}

export interface RefreshTokenDto {
  refresh_token: string;
}

export interface GoogleProfile {
  name: { givenName: string; familyName: string };
  emails: { value: string }[];
  photos: { value: string }[];
}

export interface LineIdTokenPayload {
  iss: string; // issuer
  sub: string; // LINE userId
  aud: string; // channelId ของคุณ
  exp: number;
  iat: number;
  nonce?: string;
  name?: string;
  picture?: string;
  email: string;
}
