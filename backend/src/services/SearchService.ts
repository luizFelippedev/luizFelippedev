// src/services/SearchService.ts - Serviço de Busca Avançada
import { Client } from '@elastic/elasticsearch';
import { LoggerService } from './LoggerService';
import { IProject } from '../models/Project';
import { ICertificate } from '../models/Certificate';

interface SearchResult {
  id: string;
  type: 'project' | 'certificate';
  title: string;
  description: string;
  score: number;
  highlights?: string[];
}

export class SearchService {
  private static instance: SearchService;
  private client: Client;
  private logger: LoggerService;
  private isEnabled: boolean;

  private constructor() {
    this.logger = LoggerService.getInstance();
    this.isEnabled = !!process.env.ELASTICSEARCH_URL;
    
    if (this.isEnabled) {
      this.client = new Client({
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
      });
    }
  }

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  public async searchProjects(query: string, filters?: any): Promise<SearchResult[]> {
    if (!this.isEnabled) {
      return this.fallbackSearch(query, 'projects');
    }

    try {
      const searchQuery = {
        index: 'projects',
        body: {
          query: {
            bool: {
              must: [
                {
                  multi_match: {
                    query,
                    fields: ['title^3', 'shortDescription^2', 'fullDescription', 'technologies.name', 'tags'],
                    type: 'best_fields',
                    fuzziness: 'AUTO'
                  }
                }
              ],
              filter: filters ? this.buildFilters(filters) : []
            }
          },
          highlight: {
            fields: {
              title: {},
              shortDescription: {},
              fullDescription: {}
            }
          },
          size: 50
        }
      };

      const response = await this.client.search(searchQuery);
      
      return response.body.hits.hits.map((hit: any) => ({
        id: hit._id,
        type: 'project',
        title: hit._source.title,
        description: hit._source.shortDescription,
        score: hit._score,
        highlights: hit.highlight ? Object.values(hit.highlight).flat() : []
      }));
      
    } catch (error) {
      this.logger.error('Elasticsearch search failed:', error);
      return this.fallbackSearch(query, 'projects');
    }
  }

  public async searchCertificates(query: string): Promise<SearchResult[]> {
    if (!this.isEnabled) {
      return this.fallbackSearch(query, 'certificates');
    }

    try {
      const searchQuery = {
        index: 'certificates',
        body: {
          query: {
            multi_match: {
              query,
              fields: ['title^3', 'issuer.name^2', 'skills.name', 'tags'],
              type: 'best_fields',
              fuzziness: 'AUTO'
            }
          },
          highlight: {
            fields: {
              title: {},
              'issuer.name': {},
              'skills.name': {}
            }
          },
          size: 20
        }
      };

      const response = await this.client.search(searchQuery);
      
      return response.body.hits.hits.map((hit: any) => ({
        id: hit._id,
        type: 'certificate',
        title: hit._source.title,
        description: hit._source.issuer.name,
        score: hit._score,
        highlights: hit.highlight ? Object.values(hit.highlight).flat() : []
      }));
      
    } catch (error) {
      this.logger.error('Elasticsearch search failed:', error);
      return this.fallbackSearch(query, 'certificates');
    }
  }

  public async indexProject(project: IProject): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await this.client.index({
        index: 'projects',
        id: project._id.toString(),
        body: {
          title: project.title,
          shortDescription: project.shortDescription,
          fullDescription: project.fullDescription,
          technologies: project.technologies,
          tags: project.tags,
          category: project.category,
          status: project.status,
          featured: project.featured,
          createdAt: project.createdAt
        }
      });
    } catch (error) {
      this.logger.error('Failed to index project:', error);
    }
  }

  public async updateProject(project: IProject): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await this.client.update({
        index: 'projects',
        id: project._id.toString(),
        body: {
          doc: {
            title: project.title,
            shortDescription: project.shortDescription,
            fullDescription: project.fullDescription,
            technologies: project.technologies,
            tags: project.tags,
            category: project.category,
            status: project.status,
            featured: project.featured,
            updatedAt: project.updatedAt
          }
        }
      });
    } catch (error) {
      this.logger.error('Failed to update project index:', error);
    }
  }

  public async removeProject(projectId: string): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await this.client.delete({
        index: 'projects',
        id: projectId
      });
    } catch (error) {
      this.logger.error('Failed to remove project from index:', error);
    }
  }

  private buildFilters(filters: any): any[] {
    const elasticFilters = [];
    
    if (filters.category) {
      elasticFilters.push({ term: { category: filters.category } });
    }
    
    if (filters.status) {
      elasticFilters.push({ term: { status: filters.status } });
    }
    
    if (filters.featured !== undefined) {
      elasticFilters.push({ term: { featured: filters.featured } });
    }
    
    if (filters.tags && filters.tags.length > 0) {
      elasticFilters.push({ terms: { tags: filters.tags } });
    }

    return elasticFilters;
  }

  private async fallbackSearch(query: string, type: string): Promise<SearchResult[]> {
    // Implementação de busca fallback usando MongoDB text search
    this.logger.info(`Using fallback search for: ${query} in ${type}`);
    
    try {
      const { Project } = await import('../models/Project');
      const { Certificate } = await import('../models/Certificate');
      
      if (type === 'projects') {
        const projects = await Project.find({
          $text: { $search: query },
          isActive: true
        })
        .select('title shortDescription')
        .limit(20)
        .lean();

        return projects.map(p => ({
          id: p._id.toString(),
          type: 'project' as const,
          title: p.title,
          description: p.shortDescription,
          score: 1
        }));
      } else {
        const certificates = await Certificate.find({
          $text: { $search: query },
          isActive: true
        })
        .select('title issuer.name')
        .limit(20)
        .lean();

        return certificates.map(c => ({
          id: c._id.toString(),
          type: 'certificate' as const,
          title: c.title,
          description: c.issuer.name,
          score: 1
        }));
      }
    } catch (error) {
      this.logger.error('Fallback search failed:', error);
      return [];
    }
  }
}