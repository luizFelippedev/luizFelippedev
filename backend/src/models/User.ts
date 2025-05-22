// src/models/User.ts - User model
import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

const socialLinkSchema = new Schema({
  platform: { type: String, required: true },
  url: { type: String, required: true },
  username: String
});

const skillSchema = new Schema({
  name: { type: String, required: true },
  level: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    required: true 
  },
  category: { 
    type: String, 
    enum: ['frontend', 'backend', 'database', 'devops', 'mobile', 'design', 'other'],
    required: true 
  },
  yearsOfExperience: { type: Number, required: true },
  icon: String
});

const userSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['admin', 'visitor'], default: 'visitor' },
  avatar: String,
  bio: { type: String, maxlength: 500 },
  skills: [skillSchema],
  socialLinks: [socialLinkSchema]
}, {
  timestamps: true,
  toJSON: { 
    transform: (doc, ret) => {
      delete ret.password;
      return ret;
    }
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export default model<IUser>('User', userSchema);
