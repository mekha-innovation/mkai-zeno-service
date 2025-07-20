import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface'; // ต้องสร้าง interface นี้

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // ดึง JWT จาก Authorization Header
      ignoreExpiration: false, // ไม่ให้ข้ามการตรวจสอบ Expiration
      secretOrKey: process.env.JWT_SECRET, // ใช้ key ที่ใช้ในการเซ็น JWT
    });
  }

  validate(payload: JwtPayload) {
    // ฟังก์ชันนี้จะถูกเรียกใช้เมื่อ token ถูกตรวจสอบและ valid
    return { sub: payload.sub, email: payload.email }; // คืนค่าข้อมูลผู้ใช้จาก JWT payload
  }
}
