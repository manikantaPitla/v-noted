import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'v-noted API',
      version: '2.0.0',
      description: 'REST API documentation for v-noted backend',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://v-noted.onrender.com' 
          : `http://localhost:${process.env.PORT || 3000}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Internal server error',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '1026061227587' },
            email: { type: 'string', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe' },
            avatar: { type: 'string', example: 'https://lh3.googleusercontent.com/a/...' },
            accent_color: { type: 'string', example: '#818CF8' },
            theme: { type: 'string', example: 'dark' },
          },
        },
        Note: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'c4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9' },
            user_id: { type: 'string', example: '1026061227587' },
            title: { type: 'string', example: 'My First Note' },
            content_json: { type: 'object', example: { type: 'doc', content: [{ type: 'paragraph' }] } },
            content_text: { type: 'string', example: 'My First Note content text' },
            category: { type: 'string', nullable: true, example: 'a1b2c3d4' },
            tags: { type: 'array', items: { type: 'string' }, example: ['work', 'ideas'] },
            is_public: { type: 'boolean', example: false },
            is_pinned: { type: 'boolean', example: false },
            created_at: { type: 'string', format: 'date-time', example: '2026-09-26T14:15:00.000Z' },
            updated_at: { type: 'string', format: 'date-time', example: '2026-09-26T14:15:00.000Z' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6' },
            user_id: { type: 'string', example: '1026061227587' },
            name: { type: 'string', example: 'Work' },
            color: { type: 'string', example: '#818CF8' },
            created_at: { type: 'string', format: 'date-time', example: '2026-09-26T14:15:00.000Z' },
            updated_at: { type: 'string', format: 'date-time', nullable: true, example: null },
          },
        },
        Tag: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'javascript' },
            created_at: { type: 'string', format: 'date-time', example: '2026-09-26T14:15:00.000Z' },
          },
        },
        Presence: {
          type: 'object',
          properties: {
            viewer_id: { type: 'string', example: 'viewer-123' },
            name: { type: 'string', example: 'Guest Viewer' },
            email: { type: 'string', example: 'guest@example.com' },
            avatar: { type: 'string', example: '' },
            last_seen_at: { type: 'string', format: 'date-time', example: '2026-09-26T14:15:00.000Z' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  // Gate docs in production
  if (process.env.NODE_ENV !== 'production') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'v-noted API Docs'
    }));
    console.log(`[swagger] Docs available at /api-docs`);
  }
}
