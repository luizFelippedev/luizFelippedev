// src/app.ts - Arquivo principal de inicialização
import { PortfolioServer } from './server';
import { BackupService } from './services/BackupService';
import { LoggerService } from './services/LoggerService';

const logger = LoggerService.getInstance();

async function bootstrap() {
  try {
    // Iniciar servidor
    const server = new PortfolioServer();
    await server.start();

    // Configurar backups automáticos
    const backupService = BackupService.getInstance();
    await backupService.scheduleBackups();

    logger.info('🎉 Portfolio Enterprise Backend started successfully');
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM signal. Shutting down gracefully...');
      await server.shutdown();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('Received SIGINT signal. Shutting down gracefully...');
      await server.shutdown();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();