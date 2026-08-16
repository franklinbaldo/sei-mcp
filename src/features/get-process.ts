import { SeiClient } from '../sei-client.js';
import * as cheerio from 'cheerio';

export interface DocumentNode {
    id: string;
    protocolId: string;
    name: string;
    type: string;
    isSigned: boolean;
    level: number;
}

export interface ProcessDetails {
    id: string;
    protocol: string;
    documents: DocumentNode[];
    metadata: Record<string, string>;
}

export function parseDocumentTreeHtml(treeHtml: string, protocolId: string): DocumentNode[] {
    const $ = cheerio.load(treeHtml);
    const documents: DocumentNode[] = [];
    const regex = /infraAdicionarNo\s*\(([^)]+)\)/g;
    const scriptContent = $('script').text();
    let match: RegExpExecArray | null;

    while ((match = regex.exec(scriptContent)) !== null) {
        const args = match[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
        const link = args[3];
        if (!link) continue;

        const query = link.includes('?') ? link.split('?')[1] : '';
        const docId = new URLSearchParams(query).get('id_documento') || '';
        if (!docId) continue;

        documents.push({
            id: docId,
            protocolId,
            name: args[2],
            type: 'Document',
            isSigned: args[5]?.includes('caneta') || false,
            level: 0
        });
    }

    return documents;
}

export class GetProcessFeature {
    constructor(private client: SeiClient) {}

    async getProcess(protocolId: string): Promise<ProcessDetails> {
        await this.client.request({
            acao: 'procedimento_trabalhar',
            id_procedimento: protocolId
        });

        const treeHtml = await this.client.request({
            acao: 'arvore_visualizar',
            id_procedimento: protocolId
        });

        return {
            id: protocolId,
            protocol: '',
            documents: parseDocumentTreeHtml(treeHtml, protocolId),
            metadata: {}
        };
    }
}
