// src/models/Certificate.ts - Modelo Avançado de Certificado
import { Schema, model, Document } from 'mongoose';

export interface ICertificate extends Document {
  uuid: string;
  title: string;
  issuer: {
    name: string;
    logo?: string;
    website?: string;
    accreditation?: string;
  };
  credential: {
    id?: string;
    url?: string;
    verificationUrl?: string;
    blockchainVerification?: {
      network: string;
      contractAddress: string;
      tokenId: string;
    };
  };
  dates: {
    issued: Date;
    expires?: Date;
    renewed?: Date;
  };
  level: 'foundational' | 'associate' | 'professional' | 'expert' | 'master';
  type: 'technical' | 'business' | 'language' | 'academic' | 'professional';
  skills: Array<{
    name: string;
    category: string;
    proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }>;
  media: {
    certificate: string;
    badge?: string;
    transcript?: string;
  };
  verification: {
    verified: boolean;
    verifiedAt?: Date;
    verificationMethod: 'manual' | 'api' | 'blockchain';
    notes?: string;
  };
  metadata: {
    courseHours?: number;
    examScore?: number;
    passingScore?: number;
    continuingEducationUnits?: number;
  };
  tags: string[];
  featured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificate>({
  uuid: { type: String, default: uuidv4, unique: true },
  title: { type: String, required: true, trim: true },
  issuer: {
    name: { type: String, required: true },
    logo: String,
    website: String,
    accreditation: String
  },
  credential: {
    id: String,
    url: String,
    verificationUrl: String,
    blockchainVerification: {
      network: String,
      contractAddress: String,
      tokenId: String
    }
  },
  dates: {
    issued: { type: Date, required: true },
    expires: Date,
    renewed: Date
  },
  level: {
    type: String,
    enum: ['foundational', 'associate', 'professional', 'expert', 'master'],
    required: true
  },
  type: {
    type: String,
    enum: ['technical', 'business', 'language', 'academic', 'professional'],
    required: true
  },
  skills: [{
    name: { type: String, required: true },
    category: { type: String, required: true },
    proficiencyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      required: true
    }
  }],
  media: {
    certificate: { type: String, required: true },
    badge: String,
    transcript: String
  },
  verification: {
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    verificationMethod: {
      type: String,
      enum: ['manual', 'api', 'blockchain'],
      default: 'manual'
    },
    notes: String
  },
  metadata: {
    courseHours: Number,
    examScore: Number,
    passingScore: Number,
    continuingEducationUnits: Number
  },
  tags: [String],
  featured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

certificateSchema.index({ 'dates.issued': -1 });
certificateSchema.index({ level: 1, type: 1 });
certificateSchema.index({ featured: -1 });

export const Certificate = model<ICertificate>('Certificate', certificateSchema);