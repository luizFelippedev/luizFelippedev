// src/services/SocketService.ts - Sistema WebSocket Avançado
import { Server as SocketIOServer, Socket } from 'socket.io';
import { RedisService } from './RedisService';
import { LoggerService } from './LoggerService';
import { AuthService } from './AuthService';
import { AnalyticsService } from './AnalyticsService';
import { NotificationService } from './NotificationService';

interface SocketUser {
  id: string;
  socketId: string;
  userId?: string;
  role?: string;
  isAuthenticated: boolean;
  connectedAt: Date;
  lastActivity: Date;
  metadata: {
    userAgent: string;
    ipAddress: string;
    location?: {
      country: string;
      city: string;
    };
  };
}

export class SocketService {
  private io: SocketIOServer;
  private redis: RedisService;
  private logger: LoggerService;
  private authService: AuthService;
  private analyticsService: AnalyticsService;
  private notificationService: NotificationService;
  private connectedUsers: Map<string, SocketUser> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.redis = RedisService.getInstance();
    this.logger = LoggerService.getInstance();
    this.authService = AuthService.getInstance();
    this.analyticsService = AnalyticsService.getInstance();
    this.notificationService = NotificationService.getInstance();
  }

  public initialize(): void {
    this.io.use(this.authenticationMiddleware.bind(this));
    
    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
      
      // Event handlers
      socket.on('authenticate', (data) => this.handleAuthentication(socket, data));
      socket.on('join_room', (data) => this.handleJoinRoom(socket, data));
      socket.on('leave_room', (data) => this.handleLeaveRoom(socket, data));
      socket.on('admin_dashboard_subscribe', () => this.handleAdminDashboardSubscribe(socket));
      socket.on('project_view', (data) => this.handleProjectView(socket, data));
      socket.on('real_time_analytics', () => this.handleRealTimeAnalytics(socket));
      socket.on('user_activity', (data) => this.handleUserActivity(socket, data));
      socket.on('disconnect', () => this.handleDisconnection(socket));
      
      // Error handling
      socket.on('error', (error) => {
        this.logger.error('Socket error:', error);
      });
    });

    // Broadcast real-time data every 10 seconds
    setInterval(() => {
      this.broadcastRealTimeData();
    }, 10000);

    this.logger.info('WebSocket service initialized');
  }

  private async authenticationMiddleware(socket: Socket, next: Function): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      
      if (token) {
        const user = await this.authService.verifyToken(token);
        if (user) {
          socket.userId = user.id;
          socket.userRole = user.role;
          socket.isAuthenticated = true;
        }
      }
      
      next();
    } catch (error) {
      this.logger.error('Socket authentication error:', error);
      next();
    }
  }

  private async handleConnection(socket: Socket): Promise<void> {
    const userAgent = socket.handshake.headers['user-agent'] || '';
    const ipAddress = socket.handshake.address;
    
    const socketUser: SocketUser = {
      id: socket.id,
      socketId: socket.id,
      userId: socket.userId,
      role: socket.userRole,
      isAuthenticated: socket.isAuthenticated || false,
      connectedAt: new Date(),
      lastActivity: new Date(),
      metadata: {
        userAgent,
        ipAddress,
        location: await this.getLocationFromIP(ipAddress)
      }
    };

    this.connectedUsers.set(socket.id, socketUser);
    
    // Track user sessions
    if (socketUser.userId) {
      if (!this.userSessions.has(socketUser.userId)) {
        this.userSessions.set(socketUser.userId, new Set());
      }
      this.userSessions.get(socketUser.userId)!.add(socket.id);
      
      // Join user-specific room
      socket.join(`user:${socketUser.userId}`);
      
      if (socketUser.role === 'admin') {
        socket.join('admins');
      }
    }

    // Store connection in Redis
    await this.redis.getClient().setex(
      `socket:${socket.id}`,
      3600,
      JSON.stringify(socketUser)
    );

    // Analytics
    await this.analyticsService.trackEvent({
      type: 'socket_connection',
      sessionId: socket.id,
      userId: socketUser.userId,
      data: {
        userAgent,
        ipAddress,
        isAuthenticated: socketUser.isAuthenticated
      },
      timestamp: new Date()
    });

    // Send welcome message
    socket.emit('connection_established', {
      socketId: socket.id,
      serverTime: new Date().toISOString(),
      connectedUsers: this.getPublicUserCount()
    });

    this.logger.info(`Socket connected: ${socket.id}`, {
      userId: socketUser.userId,
      isAuthenticated: socketUser.isAuthenticated
    });
  }

  private async handleAuthentication(socket: Socket, data: any): Promise<void> {
    try {
      const { token } = data;
      const user = await this.authService.verifyToken(token);
      
      if (user) {
        socket.userId = user.id;
        socket.userRole = user.role;
        socket.isAuthenticated = true;
        
        // Update stored user data
        const socketUser = this.connectedUsers.get(socket.id);
        if (socketUser) {
          socketUser.userId = user.id;
          socketUser.role = user.role;
          socketUser.isAuthenticated = true;
          this.connectedUsers.set(socket.id, socketUser);
        }
        
        // Join appropriate rooms
        socket.join(`user:${user.id}`);
        if (user.role === 'admin') {
          socket.join('admins');
        }
        
        socket.emit('authentication_success', {
          user: {
            id: user.id,
            name: user.name,
            role: user.role
          }
        });
        
        this.logger.info(`Socket authenticated: ${socket.id} - User: ${user.id}`);
      } else {
        socket.emit('authentication_error', {
          message: 'Invalid token'
        });
      }
    } catch (error) {
      this.logger.error('Socket authentication error:', error);
      socket.emit('authentication_error', {
        message: 'Authentication failed'
      });
    }
  }

  private handleJoinRoom(socket: Socket, data: any): void {
    const { room } = data;
    
    // Validate room access
    if (this.canJoinRoom(socket, room)) {
      socket.join(room);
      socket.emit('room_joined', { room });
      
      this.logger.info(`Socket ${socket.id} joined room: ${room}`);
    } else {
      socket.emit('room_join_error', {
        message: 'Access denied to room'
      });
    }
  }

  private handleLeaveRoom(socket: Socket, data: any): void {
    const { room } = data;
    socket.leave(room);
    socket.emit('room_left', { room });
  }

  private async handleAdminDashboardSubscribe(socket: Socket): Promise<void> {
    if (socket.userRole !== 'admin') {
      socket.emit('subscription_error', {
        message: 'Admin access required'
      });
      return;
    }

    socket.join('admin_dashboard');
    
    // Send initial dashboard data
    const dashboardData = await this.getDashboardData();
    socket.emit('dashboard_data', dashboardData);
    
    this.logger.info(`Admin subscribed to dashboard: ${socket.id}`);
  }

  private async handleProjectView(socket: Socket, data: any): Promise<void> {
    const { projectId, slug } = data;
    
    // Track project view
    await this.analyticsService.trackEvent({
      type: 'project_view',
      sessionId: socket.id,
      userId: socket.userId,
      data: { projectId, slug },
      timestamp: new Date()
    });

    // Broadcast to admin dashboard
    this.io.to('admin_dashboard').emit('project_view_update', {
      projectId,
      slug,
      timestamp: new Date(),
      userId: socket.userId
    });
  }

  private async handleRealTimeAnalytics(socket: Socket): Promise<void> {
    if (socket.userRole !== 'admin') {
      return;
    }

    const analytics = await this.analyticsService.getRealTimeMetrics();
    socket.emit('real_time_analytics', analytics);
  }

  private handleUserActivity(socket: Socket, data: any): void {
    const socketUser = this.connectedUsers.get(socket.id);
    if (socketUser) {
      socketUser.lastActivity = new Date();
      this.connectedUsers.set(socket.id, socketUser);
    }

    // Track activity for analytics
    this.analyticsService.trackEvent({
      type: 'user_activity',
      sessionId: socket.id,
      userId: socket.userId,
      data: data,
      timestamp: new Date()
    });
  }

  private async handleDisconnection(socket: Socket): Promise<void> {
    const socketUser = this.connectedUsers.get(socket.id);
    
    if (socketUser) {
      // Calculate session duration
      const sessionDuration = Date.now() - socketUser.connectedAt.getTime();
      
      // Remove from user sessions
      if (socketUser.userId) {
        const userSockets = this.userSessions.get(socketUser.userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            this.userSessions.delete(socketUser.userId);
          }
        }
      }
      
      // Analytics
      await this.analyticsService.trackEvent({
        type: 'socket_disconnection',
        sessionId: socket.id,
        userId: socketUser.userId,
        data: {
          sessionDuration,
          isAuthenticated: socketUser.isAuthenticated
        },
        timestamp: new Date()
      });
      
      this.connectedUsers.delete(socket.id);
    }

    // Remove from Redis
    await this.redis.getClient().del(`socket:${socket.id}`);
    
    this.logger.info(`Socket disconnected: ${socket.id}`);
  }

  private canJoinRoom(socket: Socket, room: string): boolean {
    // Admin rooms
    if (room.startsWith('admin_')) {
      return socket.userRole === 'admin';
    }
    
    // User-specific rooms
    if (room.startsWith('user:')) {
      const userId = room.split(':')[1];
      return socket.userId === userId || socket.userRole === 'admin';
    }
    
    // Public rooms
    if (room.startsWith('public_')) {
      return true;
    }
    
    return false;
  }

  private async broadcastRealTimeData(): Promise<void> {
    try {
      // Broadcast to admin dashboard
      const dashboardData = await this.getDashboardData();
      this.io.to('admin_dashboard').emit('dashboard_update', dashboardData);
      
      // Broadcast analytics to admins
      const analytics = await this.analyticsService.getRealTimeMetrics();
      this.io.to('admins').emit('real_time_analytics', analytics);
      
      // Broadcast active user count to public
      this.io.emit('active_users_count', this.getPublicUserCount());
      
    } catch (error) {
      this.logger.error('Error broadcasting real-time data:', error);
    }
  }

  private async getDashboardData(): Promise<any> {
    return {
      activeConnections: this.connectedUsers.size,
      authenticatedUsers: Array.from(this.connectedUsers.values())
        .filter(user => user.isAuthenticated).length,
      adminConnections: Array.from(this.connectedUsers.values())
        .filter(user => user.role === 'admin').length,
      timestamp: new Date()
    };
  }

  private getPublicUserCount(): number {
    return this.connectedUsers.size;
  }

  private async getLocationFromIP(ipAddress: string): Promise<any> {
    // Implementar geolocalização por IP
    // Pode usar serviços como MaxMind, IPStack, etc.
    return {
      country: 'Unknown',
      city: 'Unknown'
    };
  }

  // Public methods for external services
  public async sendNotificationToUser(userId: string, notification: any): Promise<void> {
    this.io.to(`user:${userId}`).emit('notification', notification);
  }

  public async broadcastToAdmins(event: string, data: any): Promise<void> {
    this.io.to('admins').emit(event, data);
  }

  public getConnectedUsers(): SocketUser[] {
    return Array.from(this.connectedUsers.values());
  }

  public getUserConnections(userId: string): number {
    return this.userSessions.get(userId)?.size || 0;
  }
}