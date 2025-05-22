// src/types/index.ts - TypeScript interfaces
export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'visitor';
  avatar?: string;
  bio?: string;
  skills: ISkill[];
  socialLinks: ISocialLink[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IProject {
  _id: string;
  title: string;
  description: string;
  longDescription?: string;
  technologies: string[];
  images: string[];
  liveUrl?: string;
  githubUrl?: string;
  category: 'web' | 'mobile' | 'desktop' | 'ai' | 'blockchain';
  featured: boolean;
  status: 'completed' | 'in-progress' | 'planned';
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISkill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'mobile' | 'design' | 'other';
  yearsOfExperience: number;
  icon?: string;
}

export interface ICertificate {
  _id: string;
  title: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
  image?: string;
  description?: string;
  skills: string[];
  createdAt: Date;
}

export interface ISocialLink {
  platform: 'github' | 'linkedin' | 'twitter' | 'instagram' | 'youtube' | 'website';
  url: string;
  username?: string;
}

export interface IContact {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt: Date;
}