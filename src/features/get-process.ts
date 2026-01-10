import { SeiClient } from '../sei-client.js';
import * as cheerio from 'cheerio';

export interface DocumentNode {
    id: string; // id_documento
    protocolId: string; // id_procedimento (parent)
    name: string; // e.g., "Ofício 123"
    type: string; // e.g., "Ofício"
    isSigned: boolean;
    level: number; // Tree depth
}

export interface ProcessDetails {
    id: string;
    protocol: string;
    documents: DocumentNode[];
    metadata: Record<string, string>;
}

export class GetProcessFeature {
    constructor(private client: SeiClient) {}

    async getProcess(protocolId: string): Promise<ProcessDetails> {
        // Step 1: Hit `procedimento_trabalhar` to ensure the session context is set to this process
        // This usually loads the frameset.
        await this.client.request({
            acao: 'procedimento_trabalhar',
            id_procedimento: protocolId
        });

        // Step 2: Request the "Tree" (Arvore) which contains the documents
        // URL: controlador.php?acao=arvore_visualizar&id_procedimento=...
        const treeHtml = await this.client.request({
            acao: 'arvore_visualizar',
            id_procedimento: protocolId
        });

        const $ = cheerio.load(treeHtml);
        const documents: DocumentNode[] = [];

        // Parse the JS tree or the HTML list. 
        // SEI usually renders a <div> structure or calls a JS function `infraAdicionarNo`.
        // If JS, we need regex. If HTML, we parse DOM.
        // Recent SEI versions often render static HTML for the tree for accessibility/performance or stick to JS.
        // Let's look for `infraAdicionarNo`.
        
        /*
        infraAdicionarNo(
            'ancora', 
            'id_doc', 
            'nome', 
            'url', 
            'target', 
            'img', 
            'id_pai', ...
        )
        */
       
        // Simple regex strategy to find document nodes
        // This is fragile but standard scraping practice for legacy systems like SEI.
        const regex = /infraAdicionarNo\s*\(([^)]+)\)/g;
        let match;
        const scriptContent = $('script').text();
        
        while ((match = regex.exec(scriptContent)) !== null) {
            // Args: id, idPai, nome, link, ...
            // The arguments are quoted strings.
            // Note: implementing a robust parser for this JS function call is tricky.
            // Let's try to extract basic info.
            
            const args = match[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
            // args[0] = Node ID (often id_documento or generated)
            // args[1] = Parent ID
            // args[2] = Name (e.g. "Ofício 123")
            // args[3] = Link
            
            // We need to find real id_documento. It's usually in the Link.
            const link = args[3];
            let docId = '';
            if (link) {
                const p = new URLSearchParams(link.split('?')[1]);
                docId = p.get('id_documento') || '';
            }

            if (docId) {
                documents.push({
                    id: docId,
                    protocolId,
                    name: args[2],
                    type: 'Document', // hard to infer precise type without more parsing
                    isSigned: args[5]?.includes('caneta') || false, // simplistic check
                    level: 0 // logic to determine hierarchy requires parsing parent IDs
                });
            }
        }
        
        // If regex fails (e.g. SEI version different), try parsing DOM elements if they exist (sometimes <div id="divArvore">...</div>)
        // For now, regex on `infraAdicionarNo` is the most common way to get the full tree structure in SEI.

        return {
            id: protocolId,
            protocol: '', // Would need to parse from title or other metadata
            documents,
            metadata: {}
        };
    }
}
