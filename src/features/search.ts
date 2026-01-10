import { SeiClient } from '../sei-client.js';
import * as cheerio from 'cheerio';
import { ProcessSummary } from './list-processes.js';

export class SearchFeature {
    constructor(private client: SeiClient) {}

    async search(query: string): Promise<ProcessSummary[]> {
        // Use the quick search (usually found in the top right) or protocol search page.
        // Endpoint: controlador.php?acao=protocolo_pesquisar&acao_origem=...
        // Form post: txtPesquisaRapida = query
        
        // This usually returns a list similar to the generated/received processes if multiple results,
        // OR redirects directly to the process if only one match.
        
        // Let's use `acao=pesquisa_rapida` or similar.
        // Standard SEI: `acao=protocolo_pesquisar` is the main search form.
        
        const html = await this.client.request({
            acao: 'protocolo_pesquisar_rapido',
            txtPesquisaRapida: query
        }, 'POST', {
            txtPesquisaRapida: query
        });

        const $ = cheerio.load(html);
        const results: ProcessSummary[] = [];

        // Check if we were redirected to a specific process (tree view)
        if ($('#ifrArvore').length > 0) {
            // It's a single process result
            // We can extract the ID from the iframe src or variables
            const src = $('#ifrArvore').attr('src');
            if (src) {
                const p = new URLSearchParams(src.split('?')[1]);
                const id = p.get('id_procedimento');
                if (id) {
                    results.push({
                        id,
                        protocol: query, // simplified
                        link: src,
                        type: 'Single Result',
                        interested: [],
                        unit: '',
                        status: 'Found'
                    });
                }
            }
        } else {
            // It's a list of results
            // Parse the result table (usually #tblResultados or similar)
            $('table.infraTable tbody tr').each((i, el) => {
                const tr = $(el);
                if (tr.find('th').length) return; // skip header

                // Parsing logic similar to list-processes but adapted for search results table
                // Layout: Checkbox | Protocol (Link) | Type | Interested | Date ...
                const link = tr.find('a').first();
                const protocol = link.text().trim();
                const href = link.attr('href') || '';
                const p = new URLSearchParams(href.split('?')[1]);
                const id = p.get('id_procedimento');

                if (id) {
                    results.push({
                        id,
                        protocol,
                        link: href,
                        type: 'Search Result',
                        interested: [], // Need to find column index
                        unit: '',
                        status: 'Found'
                    });
                }
            });
        }

        return results;
    }
}
