// src/models/Project.ts - Modelo Avançado de Projeto
import { Schema, model, Document, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IProject extends Document {
  _id: Types.ObjectId;
  uuid: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  challenges: string[];
  solutions: string[];
  results: {
    metrics: Array<{ name: string; value: string; improvement?: string }>;
    testimonials: Array<{ author: string; role: string; content: string; rating: number }>;
  };
  technologies: Array<{
    name: string;
    category: 'frontend' | 'backend' | 'database' | 'devops' | 'mobile' | 'ai' | 'blockchain';
    level: 'primary' | 'secondary' | 'learning';
    icon?: string;
    color?: string;
  }>;
  media: {
    featuredImage: string;
    gallery: string[];
    videos: Array<{ url: string; type: 'demo' | 'presentation' | 'code_review' }>;
    screenshots: Array<{ url: string; description: string; device: 'desktop' | 'tablet' | 'mobile' }>;
  };
  links: {
    live?: string;
    github?: string;
    documentation?: string;
    caseStudy?: string;
    api?: string;
  };
  category: 'web_app' | 'mobile_app' | 'desktop_app' | 'ai_ml' | 'blockchain' | 'iot' | 'game' | 'api';
  status: 'concept' | 'development' | 'testing' | 'deployed' | 'maintenance' | 'archived';
  visibility: 'public' | 'private' | 'client_only';
  featured: boolean;
  priority: number;
  timeline: {
    startDate: Date;
    endDate?: Date;
    milestones: Array<{
      title: string;
      description: string;
      date: Date;
      status: 'pending' | 'in_progress' | 'completed';
    }>;
  };
  team: Array<{
    name: string;
    role: string;
    avatar?: string;
    linkedin?: string;
  }>;
  client?: {
    name: string;
    industry: string;
    logo?: string;
    website?: string;
  };
  tags: string[];
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords: string[];
  };
  analytics: {
    views: number;
    likes: number;
    shares: number;
    inquiries: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>({
  uuid: { type: String, default: uuidv4, unique: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, required: true, unique: true, lowercase: true },
  shortDescription: { type: String, required: true, maxlength: 200 },
  fullDescription: { type: String, required: true, maxlength: 5000 },
  challenges: [{ type: String, maxlength: 500 }],
  solutions: [{ type: String, maxlength: 500 }],
  results: {
    metrics: [{
      name: { type: String, required: true },
      value: { type: String, required: true },
      improvement: String
    }],
    testimonials: [{
      author: { type: String, required: true },
      role: { type: String, required: true },
      content: { type: String, required: true, maxlength: 1000 },
      rating: { type: Number, min: 1, max: 5 }
    }]
  },
  technologies: [{
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['frontend', 'backend', 'database', 'devops', 'mobile', 'ai', 'blockchain'],
      required: true
    },
    level: {
      type: String,
      enum: ['primary', 'secondary', 'learning'],
      default: 'primary'
    },
    icon: String,
    color: String
  }],
  media: {
    featuredImage: { type: String, required: true },
    gallery: [String],
    videos: [{
      url: { type: String, required: true },
      type: { type: String, enum: ['demo', 'presentation', 'code_review'], required: true }
    }],
    screenshots: [{
      url: { type: String, required: true },
      description: String,
      device: { type: String, enum: ['desktop', 'tablet', 'mobile'], default: 'desktop' }
    }]
  },
  links: {
    live: String,
    github: String,
    documentation: String,
    caseStudy: String,
    api: String
  },
  category: {
    type: String,
    enum: ['web_app', 'mobile_app', 'desktop_app', 'ai_ml', 'blockchain', 'iot', 'game', 'api'],
    required: true
  },
  status: {
    type: String,
    enum: ['concept', 'development', 'testing', 'deployed', 'maintenance', 'archived'],
    default: 'concept'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'client_only'],
    default: 'public'
  },
  featured: { type: Boolean, default: false },
  priority: { type: Number, default: 0, min: 0, max: 10 },
  timeline: {
    startDate: { type: Date, required: true },
    endDate: Date,
    milestones: [{
      title: { type: String, required: true },
      description: String,
      date: { type: Date, required: true },
      status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' }
    }]
  },
  team: [{
    name: { type: String, required: true },
    role: { type: String, required: true },
    avatar: String,
    linkedin: String
  }],
  client: {
    name: String,
    industry: String,
    logo: String,
    website: String
  },
  tags: [{ type: String, lowercase: true, trim: true }],
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  analytics: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    inquiries: { type: Number, default: 0 }
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes para performance
projectSchema.index({ slug: 1 });
projectSchema.index({ category: 1, status: 1 });
projectSchema.index({ featured: -1, priority: -1 });
projectSchema.index({ 'analytics.views': -1 });
projectSchema.index({ tags: 1 });
projectSchema.index({ createdAt: -1 });

// Middleware para gerar slug
projectSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title.toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

export const Project = model<IProject>('Project', projectSchema);