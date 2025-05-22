// MongoDB initialization script
db = db.getSiblingDB('portfolio_production');

// Create collections
db.createCollection('users');
db.createCollection('projects');
db.createCollection('certificates');
db.createCollection('audit_logs');
db.createCollection('migrations');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.projects.createIndex({ slug: 1 }, { unique: true });
db.projects.createIndex({ featured: -1, priority: -1 });
db.certificates.createIndex({ 'dates.issued': -1 });
db.audit_logs.createIndex({ timestamp: -1 });

print('Database initialized successfully');
