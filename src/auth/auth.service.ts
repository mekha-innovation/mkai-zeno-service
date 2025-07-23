import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenResponseDto } from './dto/refetch_token.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RevokedToken } from './schemas/revoke-token.schema';
import { BadRequestException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { User, UserType } from 'src/user/schemas/user.schema';
import { GoogleProfile, JwtPayload, LineIdTokenPayload, LineProfile } from './interfaces/jwt-payload.interface';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,

    private readonly userService: UserService,

    @InjectModel(RevokedToken.name)
    private revokedTokenModel: Model<RevokedToken>,
  ) {}

  getHello(): string {
    return 'Hello Auth!';
  }

  decodeIdTokenLine(idToken: string) {
    const decoded = jwt.decode(idToken, { complete: true });
    if (!decoded) throw new Error('Invalid ID Token');
    else {
      return decoded.payload as LineIdTokenPayload;
    }
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    const isRevoked = await this.isTokenRevoked(token);
    if (isRevoked) {
      throw new UnauthorizedException('Token has been revoked');
    }

    try {
      const decoded = this.jwtService.verify<JwtPayload>(token);
      return decoded;
    } catch (e) {
      throw new UnauthorizedException(e);
    }
  }

  async generateTokenLine(user: LineProfile, type: UserType): Promise<{ access_token: string; refresh_token: string }> {
    const userExists = await this.userService.existsEmail(user.email, type);
    let newUser: User | null;

    if (!userExists) {
      // ถ้าไม่มีผู้ใช้ สร้างผู้ใช้ใหม่
      newUser = await this.userService.create({
        email: user.email,
        displayName: user.displayName,
        picture: user.pictureUrl,
        type,
      });
    } else {
      // ถ้ามีผู้ใช้แล้ว ค้นหาผู้ใช้
      newUser = await this.userService.findByEmail(user.email);
    }

    const payload = { email: user.email, sub: newUser?._id };

    // ใช้ JWT Service เพื่อสร้าง token
    return {
      access_token: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRATION,
      }),
      refresh_token: this.jwtService.sign(payload, {
        secret: process.env.REFRESH_JWT_SECRET, // คีย์สำหรับ Refresh Token
        expiresIn: process.env.REFRESH_JWT_EXPIRATION, // เวลาหมดอายุของ Refresh Token
      }),
    };
  }

  async generateTokenGoogle(
    user: GoogleProfile,
    type: UserType,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const userExists = await this.userService.existsEmail(user.emails[0].value, type);
    let newUser: User | null;

    if (!userExists) {
      // ถ้าไม่มีผู้ใช้ สร้างผู้ใช้ใหม่
      newUser = await this.userService.create({
        email: user.emails[0].value,
        firstName: user.name.givenName,
        lastName: user.name.familyName,
        picture: user.photos[0].value,
        type,
      });
    } else {
      // ถ้ามีผู้ใช้แล้ว ค้นหาผู้ใช้
      newUser = await this.userService.findByEmail(user.emails[0].value);
    }

    const payload = { email: user.emails[0].value, sub: newUser?._id };

    // ใช้ JWT Service เพื่อสร้าง token
    return {
      access_token: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRATION,
      }),
      refresh_token: this.jwtService.sign(payload, {
        secret: process.env.REFRESH_JWT_SECRET, // คีย์สำหรับ Refresh Token
        expiresIn: process.env.REFRESH_JWT_EXPIRATION, // เวลาหมดอายุของ Refresh Token
      }),
    };
  }

  async refreshAccessToken(refresh_token: string): Promise<RefreshTokenResponseDto> {
    const isRevoked = await this.isTokenRevoked(refresh_token);
    if (isRevoked) {
      throw new BadRequestException('Refresh token has been revoked');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(refresh_token, {
        secret: process.env.REFRESH_JWT_SECRET,
      });

      const newAccessToken = this.jwtService.sign(
        { email: payload.email, sub: payload.sub },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: process.env.JWT_EXPIRATION,
        },
      );
      return { accessToken: newAccessToken };
    } catch (e: any) {
      throw new UnauthorizedException(e);
    }
  }

  async revokeToken(token: string): Promise<void> {
    const decoded = this.jwtService.decode<JwtPayload>(token);
    if (!decoded || typeof decoded === 'string') {
      throw new Error('Invalid token');
    }

    const expiresAt = new Date(decoded.exp * 1000); // แปลง UNIX timestamp เป็น Date

    // ตรวจสอบว่าโทเค็นถูกยกเลิกไปแล้วหรือไม่
    const exists = await this.revokedTokenModel.findOne({ token }).exec();
    if (exists) {
      return;
    }

    // บันทึกลง MongoDB
    await this.revokedTokenModel.create({ token, expiresAt });
  }

  async isTokenRevoked(token: string): Promise<boolean> {
    const revokedToken = await this.revokedTokenModel.findOne({ token }).exec();
    return !!revokedToken;
  }

  async logout(access_token: string, refresh_token?: string): Promise<string> {
    await this.revokeToken(access_token);

    if (refresh_token) {
      await this.revokeToken(refresh_token);
    }

    return Promise.resolve('success');
  }
}
