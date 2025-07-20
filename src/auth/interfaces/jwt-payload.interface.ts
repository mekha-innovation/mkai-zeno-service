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
