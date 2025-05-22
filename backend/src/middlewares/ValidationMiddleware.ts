// src/middleware/ValidationMiddleware.ts - Sistema de Validação Avançado
import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { LoggerService } from '../services/LoggerService';
import { ApiResponse } from '../utils/ApiResponse';

export class ValidationMiddleware {
  private static logger = LoggerService.getInstance();

  // Validação genérica de body
  public static validateBody(fields: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        ValidationMiddleware.logger.warn('Validation failed', {
          errors: errors.array(),
          body: req.body
        });
        
        return res.status(400).json(ApiResponse.error(
          'Validation failed',
          400,
          errors.array()
        ));
      }
      
      // Sanitizar dados validados
      req.validatedData = req.body;
      next();
    };
  }

  // Validações específicas para projetos
  public static projectValidation(): ValidationChain[] {
    return [
      body('title')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Title must be between 1 and 100 characters'),
      
      body('shortDescription')
        .trim()
        .isLength({ min: 10, max: 200 })
        .withMessage('Short description must be between 10 and 200 characters'),
      
      body('fullDescription')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Full description must not exceed 5000 characters'),
      
      body('category')
        .isIn(['web_app', 'mobile_app', 'desktop_app', 'ai_ml', 'blockchain', 'iot', 'game', 'api'])
        .withMessage('Invalid category'),
      
      body('status')
        .optional()
        .isIn(['concept', 'development', 'testing', 'deployed', 'maintenance', 'archived'])
        .withMessage('Invalid status'),
      
      body('visibility')
        .optional()
        .isIn(['public', 'private', 'client_only'])
        .withMessage('Invalid visibility'),
      
      body('technologies')
        .isArray({ min: 1 })
        .withMessage('At least one technology is required'),
      
      body('technologies.*.name')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Technology name must be between 1 and 50 characters'),
      
      body('technologies.*.category')
        .isIn(['frontend', 'backend', 'database', 'devops', 'mobile', 'ai', 'blockchain'])
        .withMessage('Invalid technology category'),
      
      body('technologies.*.level')
        .optional()
        .isIn(['primary', 'secondary', 'learning'])
        .withMessage('Invalid technology level'),
      
      body('timeline.startDate')
        .isISO8601()
        .withMessage('Start date must be a valid date'),
      
      body('timeline.endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date')
        .custom((value, { req }) => {
          if (value && new Date(value) <= new Date(req.body.timeline.startDate)) {
            throw new Error('End date must be after start date');
          }
          return true;
        }),
      
      body('links.live')
        .optional()
        .isURL()
        .withMessage('Live URL must be a valid URL'),
      
      body('links.github')
        .optional()
        .isURL()
        .withMessage('GitHub URL must be a valid URL')
        .custom((value) => {
          if (value && !value.includes('github.com')) {
            throw new Error('GitHub URL must be from github.com');
          }
          return true;
        }),
      
      body('priority')
        .optional()
        .isInt({ min: 0, max: 10 })
        .withMessage('Priority must be between 0 and 10'),
      
      body('featured')
        .optional()
        .isBoolean()
        .withMessage('Featured must be a boolean value')
    ];
  }

  // Validações para certificados
  public static certificateValidation(): ValidationChain[] {
    return [
      body('title')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Title must be between 1 and 100 characters'),
      
      body('issuer.name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Issuer name must be between 1 and 100 characters'),
      
      body('issuer.website')
        .optional()
        .isURL()
        .withMessage('Issuer website must be a valid URL'),
      
      body('dates.issued')
        .isISO8601()
        .withMessage('Issue date must be a valid date'),
      
      body('dates.expires')
        .optional()
        .isISO8601()
        .withMessage('Expiry date must be a valid date')
        .custom((value, { req }) => {
          if (value && new Date(value) <= new Date(req.body.dates.issued)) {
            throw new Error('Expiry date must be after issue date');
          }
          return true;
        }),
      
      body('level')
        .isIn(['foundational', 'associate', 'professional', 'expert', 'master'])
        .withMessage('Invalid level'),
      
      body('type')
        .isIn(['technical', 'business', 'language', 'academic', 'professional'])
        .withMessage('Invalid type'),
      
      body('skills')
        .isArray({ min: 1 })
        .withMessage('At least one skill is required'),
      
      body('skills.*.name')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Skill name must be between 1 and 50 characters'),
      
      body('skills.*.proficiencyLevel')
        .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
        .withMessage('Invalid proficiency level'),
      
      body('credential.url')
        .optional()
        .isURL()
        .withMessage('Credential URL must be a valid URL'),
      
      body('credential.verificationUrl')
        .optional()
        .isURL()
        .withMessage('Verification URL must be a valid URL')
    ];
  }

  // Validações para usuários
  public static userValidation(): ValidationChain[] {
    return [
      body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
        .withMessage('Name can only contain letters and spaces'),
      
      body('email')
        .normalizeEmail()
        .isEmail()
        .withMessage('Must be a valid email address'),
      
      body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
      
      body('role')
        .optional()
        .isIn(['admin', 'user'])
        .withMessage('Invalid role'),
      
      body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Bio must not exceed 500 characters')
    ];
  }

  // Validação de parâmetros de rota
  public static paramValidation(paramName: string, type: 'id' | 'slug' | 'uuid' = 'id'): ValidationChain {
    switch (type) {
      case 'id':
        return param(paramName)
          .isMongoId()
          .withMessage(`${paramName} must be a valid MongoDB ObjectId`);
      
      case 'slug':
        return param(paramName)
          .matches(/^[a-z0-9-]+$/)
          .withMessage(`${paramName} must be a valid slug (lowercase letters, numbers, and hyphens only)`);
      
      case 'uuid':
        return param(paramName)
          .isUUID()
          .withMessage(`${paramName} must be a valid UUID`);
      
      default:
        return param(paramName).notEmpty();
    }
  }

  // Validação de query parameters
  public static queryValidation(): ValidationChain[] {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
      
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
      
      query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be asc or desc'),
      
      query('featured')
        .optional()
        .isBoolean()
        .withMessage('Featured must be a boolean value'),
      
      query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date'),
      
      query('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date')
    ];
  }

  // Middleware para processar erros de validação
  public static handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }));
      
      ValidationMiddleware.logger.warn('Validation failed', {
        url: req.originalUrl,
        method: req.method,
        errors: formattedErrors,
        body: req.body
      });
      
      return res.status(400).json(ApiResponse.error(
        'Validation failed',
        400,
        formattedErrors
      ));
    }
    
    next();
  }

  // Sanitização customizada
  public static sanitizeHtml(fieldNames: string[]) {
    const DOMPurify = require('isomorphic-dompurify');
    
    return (req: Request, res: Response, next: NextFunction) => {
      fieldNames.forEach(fieldName => {
        if (req.body[fieldName]) {
          req.body[fieldName] = DOMPurify.sanitize(req.body[fieldName], {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li'],
            ALLOWED_ATTR: []
          });
        }
      });
      next();
    };
  }
}