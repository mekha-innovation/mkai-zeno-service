// user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserType {
  Google = 'google',
  Line = 'line',
}

export enum PlanType {
  Free = 'Free',
  Pro = 'Pro',
  Enterprise = 'Enterprise',
}

@Schema({ timestamps: true }) // เพิ่ม timestamps สำหรับ createdAt และ updatedAt
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ default: '' })
  displayName: string;

  @Prop({ default: '' })
  firstName: string;

  @Prop({ default: '' })
  lastName: string;

  @Prop({ default: '' })
  picture: string;

  @Prop({ type: String, enum: UserType, default: UserType.Google })
  type: UserType;

  @Prop({ type: String, enum: PlanType, default: PlanType.Free })
  plan: PlanType;

  // เพิ่ม TypeScript type สำหรับ timestamps
  createdAt?: Date;

  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
