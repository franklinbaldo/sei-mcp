import { SeiClient } from '../sei-client.js';
import * as cheerio from 'cheerio';

export interface ProcessSummary {
    id: string;
    protocol: string;
    link: string;
    type: string;
    interested: string[];
    unit: string;
    status: string;
    note?: string;
}

export function parseProcessListHtml(html: string): ProcessSummary[] {
    const $ = cheerio.load(html);
    const processes: ProcessSummary[] = [];

    const parseTable = (selector: string, status: string) => {
        $(selector).find('tbody tr').each((_i, el) => {
            const tr = $(el);
            if (tr.hasClass('infraCaption') || tr.hasClass('tablesorter-headerRow')) return;

            const cols = tr.find('td');
            if (cols.length < 3) return;

            const protocolLink = cols.eq(2).find('a').first();
            if (!protocolLink.length) return;

            const protocol = protocolLink.text().trim();
            const href = protocolLink.attr('href') || '';
            const query = href.includes('?') ? href.split('?')[1] : '';
            const id = new URLSearchParams(query).get('id_procedimento');
            if (!id) return;

            const interestedText = cols.eq(3).text().trim();
            let note = '';
            const noteIcon = cols.eq(1).find(
                'a[href*="anotacao_registrar"], a[onmouseover*="infraTooltipMostrar"]'
            ).first();
            const onMouseOver = noteIcon.attr('onmouseover');
            if (onMouseOver) {
                const match = onMouseOver.match(/'([^']*)'/);
                if (match) note = match[1];
            }

            processes.push({
                id,
                protocol,
                link: href,
                type: 'Unknown',
                interested: interestedText ? [interestedText] : [],
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

export class ListProcessesFeature {
    constructor(private client: SeiClient) {}

    async listProcesses(): Promise<ProcessSummary[]> {
        const html = await this.client.request({ acao: 'procedimento_controlar' });
        return parseProcessListHtml(html);
    }
}
