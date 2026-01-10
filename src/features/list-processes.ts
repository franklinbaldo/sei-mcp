import { SeiClient } from '../sei-client.js';
import * as cheerio from 'cheerio';

export interface ProcessSummary {
    id: string; // The internal ID (id_procedimento)
    protocol: string; // The visible protocol number (e.g., 12345.000000/2023-00)
    link: string;
    type: string;
    interested: string[];
    unit: string; // The unit where it is (if listing from generated, typically)
    status: string; // e.g. "Recebido", "Gerado"
    note?: string; // Anotação
}

export class ListProcessesFeature {
    constructor(private client: SeiClient) {}

    async listProcesses(): Promise<ProcessSummary[]> {
        const html = await this.client.request({ acao: 'procedimento_controlar' });
        const $ = cheerio.load(html);
        
        const processes: ProcessSummary[] = [];

        // Helper to parse a table
        const parseTable = (selector: string, status: string) => {
            $(selector).find('tbody tr').each((i, el) => {
                const tr = $(el);
                // Skip header rows or caption rows
                if (tr.hasClass('infraCaption') || tr.hasClass('tablesorter-headerRow')) return;

                const cols = tr.find('td');
                if (cols.length < 3) return; // Not a valid row

                // 3rd column (index 2) typically contains the Protocol Link
                const protocolLink = cols.eq(2).find('a').first();
                if (!protocolLink.length) return;

                const protocol = protocolLink.text().trim();
                const href = protocolLink.attr('href') || '';
                
                // Extract id_procedimento from href
                // href example: controlador.php?acao=procedimento_trabalhar&id_procedimento=123456&...
                const urlParams = new URLSearchParams(href.split('?')[1]);
                const id = urlParams.get('id_procedimento');

                if (!id) return;

                // Interested parties are often in column 3 (index 3)
                const interestedText = cols.eq(3).text().trim();
                
                // Note: The specific column indices might vary slightly between SEI versions.
                // Standard SEI 3/4 usually:
                // 0: Checkbox
                // 1: Status Icons (Notes, etc)
                // 2: Protocol Number (Link)
                // 3: Interested / Sender
                // 4: Type (sometimes swapped with 3?)
                // Let's rely on text or classes if possible, but indices are usually consistent.
                
                // Type of process is usually column 4 or similar.
                // In some versions, col 3 is Sender/Interested, Col 4 is Note/Description, Col 5 is Type?
                // Let's grab generic text for now or try to identify.
                // SEI Pro often modifies this table, but the underlying HTML usually stays structured.
                
                // Let's assume standard layout:
                // Col 2: Protocol
                // Col 3: Interested/Attribution
                // Col 4: Note? or Type?
                
                // Better strategy: Inspect the link tooltip or surrounding elements if parsing fails.
                // But generally index 2 is Protocol. Index 3 is Interested.
                
                // Check for "Anotação" (Note) - usually an icon in Col 1 or specific tooltip.
                let note = '';
                const noteIcon = cols.eq(1).find('a[href*="anotacao_registrar"]');
                if (noteIcon.length) {
                    // SEI puts the note in the tooltip (onmouseover)
                    const onMouseOver = noteIcon.attr('onmouseover');
                    if (onMouseOver) {
                        // extract 'Text' from return infraTooltipMostrar('Text', 'Title');
                        const match = onMouseOver.match(/'([^']*)'/);
                        if (match) note = match[1];
                    }
                }

                processes.push({
                    id,
                    protocol,
                    link: href,
                    type: 'Unknown', // Hard to pinpoint column reliably without seeing HTML, will update if I can verify
                    interested: [interestedText],
                    unit: '', 
                    status,
                    note
                });
            });
        };

        parseTable('#tblProcessosRecebidos', 'Recebido');
        parseTable('#tblProcessosGerados', 'Gerado');

        return processes;
    }
}
