import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
export interface Note {
  id: string;
  user_id: string;
  title: string;
  content_json: any;
  content_text?: string;
  category?: string;
  tags?: string[];
  is_public?: boolean;
  created_at: string;
  updated_at: string;
}

type RichTextNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, any>;
  content?: RichTextNode[];
};

export class ExportService {
  /**
   * Generates a Plain Text version of the note
   */
  async generateTxt(note: Note): Promise<Buffer> {
    const title = (note.title || 'Untitled Note').trim();
    const content = this.serializeNoteToPlainText(note.content_json as Record<string, any>);
    const text = `${title}\n\n${content}`;
    return Buffer.from(text, 'utf-8');
  }

  /**
   * Generates a Word (DOCX) version of the note
   */
  async generateWord(note: Note): Promise<Buffer> {
    const title = (note.title || 'Untitled Note').trim();
    const contentJson = note.content_json as RichTextNode;

    const sections = [
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    ];

    const nodes = (contentJson && Array.isArray(contentJson.content)) ? contentJson.content : [];
    for (const node of nodes) {
      const p = this.mapNodeToDocxParagraph(node);
      if (p) sections.push(p);
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: sections,
      }],
    });

    return await Packer.toBuffer(doc);
  }

  /**
   * Generates a PDF version of the note
   */
  async generatePdf(note: Note): Promise<Buffer> {
    const title = (note.title || 'Untitled Note').trim();
    const contentJson = note.content_json as RichTextNode;

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50 });

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Header
      doc
        .fillColor('#111827')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text(title, { align: 'center' });
      doc.moveDown(2);

      // Content
      const nodes = (contentJson && Array.isArray(contentJson.content)) ? contentJson.content : [];
      for (const node of nodes) {
        try {
          this.renderNodeToPdf(doc, node);
        } catch (e) {
          console.error('[ExportService] PDF Node rendering failed:', e);
        }
      }

      doc.end();
    });
  }

  private serializeNoteToPlainText(contentJson: Record<string, any>): string {
    const root = contentJson as RichTextNode;
    return this.serializeNodes(root.content || [], 0).trim();
  }

  private serializeNodes(nodes: RichTextNode[] = [], depth = 0): string {
    const lines: string[] = [];
    let orderedIndex = 1;

    for (const node of nodes) {
      const children = node.content || [];

      if (node.type === 'text') {
        lines.push(node.text || '');
      } else if (node.type === 'paragraph' || node.type === 'heading') {
        lines.push(this.serializeNodes(children, depth).trim());
      } else if (node.type === 'bulletList') {
        lines.push(this.serializeList(children, depth, 'bullet'));
      } else if (node.type === 'orderedList') {
        lines.push(this.serializeList(children, depth, 'ordered', orderedIndex));
        orderedIndex += children.length;
      } else if (node.type === 'taskList') {
        lines.push(this.serializeList(children, depth, 'task'));
      } else if (node.type === 'codeBlock') {
        lines.push(this.serializeNodes(children, depth).trimEnd());
      } else if (node.type === 'blockquote') {
        lines.push(
          this.serializeNodes(children, depth)
            .trim()
            .split('\n')
            .map((line) => `> ${line}`)
            .join('\n')
        );
      } else if (node.type === 'horizontalRule') {
        lines.push('---');
      } else {
        lines.push(this.serializeNodes(children, depth));
      }
    }

    return lines
      .filter((line) => line !== '')
      .join('\n')
      .replace(/\n{3,}/g, '\n\n');
  }

  private serializeList(
    items: RichTextNode[],
    depth: number,
    kind: 'bullet' | 'ordered' | 'task',
    start = 1
  ): string {
    return items
      .map((item, index) => {
        const indent = '  '.repeat(depth);
        const marker =
          kind === 'ordered'
            ? `${start + index}.`
            : kind === 'task'
              ? item.attrs?.checked
                ? '- [x]'
                : '- [ ]'
              : '-';
        const body = this.serializeNodes(item.content || [], depth + 1).trim();
        const [firstLine = '', ...rest] = body.split('\n');
        const continuation = rest.map((line) => `${indent}  ${line}`).join('\n');
        return `${indent}${marker} ${firstLine}${continuation ? `\n${continuation}` : ''}`.trimEnd();
      })
      .join('\n');
  }

  private mapNodeToDocxParagraph(node: RichTextNode): Paragraph | null {
    if (node.type === 'paragraph' || node.type === 'heading') {
      const text = this.getNodeText(node);
      const heading = node.type === 'heading' ? (node.attrs?.level === 1 ? HeadingLevel.HEADING_1 : node.attrs?.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3) : undefined;
      return new Paragraph({
        children: [new TextRun(text)],
        heading,
        spacing: { after: 200 },
      });
    } else if (node.type === 'bulletList' || node.type === 'orderedList' || node.type === 'taskList') {
      const items = node.content || [];
      return items.map((item, i) => {
        const prefix = node.type === 'orderedList' ? `${i + 1}. ` : node.type === 'taskList' ? (item.attrs?.checked ? '☑ ' : '☐ ') : '• ';
        return new Paragraph({
          children: [new TextRun(`${prefix}${this.getNodeText(item)}`)],
          spacing: { after: 120 },
          indent: { left: 720 },
        });
      }) as any;
    } else if (node.type === 'blockquote') {
      return new Paragraph({
        children: [new TextRun({ text: this.getNodeText(node), italic: true, color: "666666" })],
        indent: { left: 720 },
        spacing: { before: 200, after: 200 },
      });
    } else if (node.type === 'horizontalRule') {
      return new Paragraph({
        children: [],
        border: {
          bottom: { color: "cccccc", space: 1, style: "single", size: 6 },
        },
        spacing: { before: 200, after: 200 },
      });
    }
    // Simple implementation for now, expandable
    return null;
  }

  private renderNodeToPdf(doc: PDFKit.PDFDocument, node: RichTextNode) {
    if (node.type === 'heading') {
      const level = node.attrs?.level || 1;
      const size = level === 1 ? 20 : level === 2 ? 16 : 14;
      doc.fontSize(size).font('Helvetica-Bold').text(this.getNodeText(node));
      doc.moveDown(0.5);
    } else if (node.type === 'paragraph') {
      doc.fontSize(12).font('Helvetica').text(this.getNodeText(node));
      doc.moveDown(0.5);
    } else if (node.type === 'bulletList' || node.type === 'orderedList' || node.type === 'taskList') {
      const items = node.content || [];
      items.forEach((item, i) => {
        const prefix = node.type === 'bulletList' ? '• ' : node.type === 'orderedList' ? `${i + 1}. ` : (item.attrs?.checked ? '☑ ' : '☐ ');
        doc.fontSize(12).font('Helvetica').text(`${prefix}${this.getNodeText(item)}`, { indent: 20 });
      });
      doc.moveDown(0.5);
    } else if (node.type === 'blockquote') {
      const text = this.getNodeText(node);
      doc.fontSize(12).font('Helvetica-Oblique').fillColor('#4b5563').text(text, { indent: 20 });
      doc.fillColor('#111827'); // Reset color
      doc.moveDown(0.5);
    } else if (node.type === 'codeBlock') {
      const text = this.getNodeText(node);
      doc.fontSize(10).font('Courier').fillColor('#374151').text(text, { 
        background: '#f3f4f6',
        indent: 10
      });
      doc.font('Helvetica').fillColor('#111827'); // Reset
      doc.moveDown(0.5);
    } else if (node.type === 'horizontalRule') {
      doc.moveDown(0.5)
         .moveTo(50, doc.y)
         .lineTo(doc.page.width - 50, doc.y)
         .strokeColor('#e5e7eb')
         .stroke()
         .moveDown(1);
    }
  }

  private getNodeText(node: RichTextNode): string {
    let text = '';
    const extract = (n: RichTextNode) => {
      if (n.type === 'text' && typeof n.text === 'string') {
        text += n.text;
      }
      if (Array.isArray(n.content)) {
        n.content.forEach(extract);
      }
    };
    extract(node);
    return text;
  }
}
