import { extractToken, verifyJwt } from '../../lib/auth';
import { db } from '../../lib/dynamodb';
import { ExportService } from '../../lib/export.service';

type LambdaEvent = {
  httpMethod: string;
  path: string;
  pathParameters?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
  headers?: Record<string, string | undefined>;
};

const exportService = new ExportService();

const respond = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Max-Age': '86400',
  },
  body: JSON.stringify(body),
});

export const handler = async (event: LambdaEvent) => {
  try {
    const { httpMethod, pathParameters, queryStringParameters } = event;

    if (httpMethod === 'OPTIONS') {
      return respond(200, { message: 'OK' });
    }

    const noteId = pathParameters?.id;
    const format = queryStringParameters?.format?.toLowerCase();

    // Auth check
    const token = extractToken(event);
    if (!token) return respond(401, { error: 'Unauthorized' });

    const { userId } = verifyJwt(token);
    const PK = `USER#${userId}`;

    if (!noteId) return respond(400, { error: 'Note ID is required' });
    if (!format || !['pdf', 'word', 'txt'].includes(format)) {
      return respond(400, { error: 'Invalid format. Supported: pdf, word, txt' });
    }

    // Fetch note
    const result = await db.get(PK, `NOTE#${noteId}`);
    if (!result.Item) return respond(404, { error: 'Note not found' });
    const note = result.Item as any;

    let buffer: Buffer;
    let contentType: string;
    let extension: string;

    switch (format) {
      case 'pdf':
        buffer = await exportService.generatePdf(note);
        contentType = 'application/pdf';
        extension = 'pdf';
        break;
      case 'word':
        buffer = await exportService.generateWord(note);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        extension = 'docx';
        break;
      case 'txt':
        buffer = await exportService.generateTxt(note);
        contentType = 'text/plain';
        extension = 'txt';
        break;
      default:
        return respond(400, { error: 'Unsupported format' });
    }

    const fileName = `${(note.title || 'note').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;

    return respond(200, {
      base64: buffer.toString('base64'),
      fileName,
      contentType
    });
  } catch (err: any) {
    console.error('[export-handler] Error Details:', {
      message: err.message,
      stack: err.stack,
      event: JSON.stringify(event)
    });
    return respond(500, { error: 'Internal server error', details: err.message });
  }
};
