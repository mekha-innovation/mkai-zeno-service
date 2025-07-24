// line.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { Profile } from 'passport';
import axios from 'axios';
import { LineProfile } from '../interfaces/jwt-payload.interface';
import { VerifyCallback } from 'jsonwebtoken';

@Injectable()
export class LineStrategy extends PassportStrategy(Strategy, 'line') {
  constructor() {
    if (!process.env.LINE_CLIENT_ID || !process.env.LINE_CLIENT_SECRET || !process.env.LINE_CALLBACK_URL) {
      throw new Error('LINE OAuth configuration is missing');
    }

    super({
      authorizationURL: 'https://access.line.me/oauth2/v2.1/authorize',
      tokenURL: 'https://api.line.me/oauth2/v2.1/token',
      clientID: process.env.LINE_CLIENT_ID,
      clientSecret: process.env.LINE_CLIENT_SECRET,
      callbackURL: process.env.LINE_CALLBACK_URL,
      scope: ['profile', 'openid', 'email'],
      state: true,
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback): Promise<any> {
    const response = await axios.get<LineProfile>('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = response.data;

    done(null, {
      email: data.email || data.userId,
      userId: data.userId,
      displayName: data.displayName,
      pictureUrl: data.pictureUrl ?? null,
      accessToken,
      refreshToken,
    });
  }
}
