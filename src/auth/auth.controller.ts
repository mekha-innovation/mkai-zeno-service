import { Controller, Get, Post, UseGuards, Req, Res, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { RefreshTokenDto, RefreshTokenResponseDto, RevokeTokenDto } from './dto/refetch_token.dto';
import { Response } from 'express';
import { UserType } from '../user/schemas/user.schema';
import { GoogleProfile } from './interfaces/jwt-payload.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Redirect to Google
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: { user: GoogleProfile }, @Res() res: Response) {
    const { access_token, refresh_token } = await this.authService.generateToken(req.user, UserType.Google);
    const url = `${process.env.FRONTEND_REDIRECT_URL}?access_token=${access_token}&refresh_token=${refresh_token}`;

    // redirect ไปยัง frontend
    return res.redirect(url);
  }

  @Get('hello')
  getHello() {
    return this.authService.getHello();
  }

  @Post('verify')
  verifyToken(@Body() data: { token: string }) {
    return this.authService.verifyToken(data.token);
  }

  @Post('refresh')
  refreshToken(@Body() data: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    return this.authService.refreshAccessToken(data.refreshToken);
  }

  @Post('revoke')
  reVokeToken(@Body() data: RevokeTokenDto): Promise<string> {
    return this.authService.logout(data.accessToken, data.refreshToken);
  }
}
