// line.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { Profile } from 'passport';
import axios from 'axios';
import { LineProfile } from '../interfaces/jwt-payload.interface';

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

  async validate(
    accessToken: string,
    refreshToken: string,
    params: any,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ) {
    // เรียก LINE Profile API
    const response = await axios.get<LineProfile>('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = response.data;

    const user = {
      lineId: data.userId,
      displayName: data.displayName,
      pictureUrl: data.pictureUrl ?? null,
      accessToken,
      refreshToken,
    };

    done(null, user);
  }
}
