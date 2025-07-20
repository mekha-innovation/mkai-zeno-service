// user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserType {
  Google = 'google',
  Line = 'line',
}

@Schema({ timestamps: true }) // เพิ่ม timestamps สำหรับ createdAt และ updatedAt
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ default: '' })
  firstName: string;

  @Prop({ default: '' })
  lastName: string;

  @Prop({ default: '' })
  picture: string;

  @Prop({ type: String, enum: UserType, default: UserType.Google })
  type: UserType;
}

export const UserSchema = SchemaFactory.createForClass(User);
