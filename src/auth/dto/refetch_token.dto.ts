import { ApiProperty } from '@nestjs/swagger';

export class VerifyTokenDto {
  @ApiProperty()
  token: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  refreshToken: string;
}

export class RefreshTokenResponseDto {
  @ApiProperty()
  accessToken: string;
}

export class RevokeTokenDto {
  @ApiProperty()
  accessToken: string;
  @ApiProperty()
  refreshToken: string;
}
