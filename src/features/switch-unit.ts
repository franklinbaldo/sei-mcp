import { SeiClient } from '../sei-client.js';
import * as cheerio from 'cheerio';

export interface Unit {
    id: string;
    code: string;
    name: string;
}

export class SwitchUnitFeature {
    constructor(private client: SeiClient) {}

    /**
     * Lists available units for the current user.
     * This parses the unit dropdown usually found in the top bar.
     */
    async listUnits(): Promise<Unit[]> {
        // Usually the unit selector is present on the main page
        const html = await this.client.request({ acao: 'procedimento_controlar' });
        const $ = cheerio.load(html);
        
        const units: Unit[] = [];
        
        // Strategy 1: Look for the unit selector dropdown (standard SEI)
        // Usually id="selInfraUnidades"
        $('#selInfraUnidades option').each((i, el) => {
            const id = $(el).val() as string;
            const text = $(el).text(); // e.g., "CODE - Name" or just "Name"
            
            if (id && id !== 'null') {
                // Try to split code and name
                const parts = text.split(' - ');
                const code = parts.length > 1 ? parts[0].trim() : text.trim();
                const name = parts.length > 1 ? parts.slice(1).join(' - ').trim() : text.trim();
                
                units.push({ id, code, name });
            }
        });
        
        return units;
    }

    /**
     * Switches the active unit.
     */
    async switchUnit(unitId: string): Promise<boolean> {
        // Standard SEI unit switch often involves a POST to `infra_unidade_selecionar` or similar,
        // OR sometimes just `acao=infra_unidade_selecionar&id_unidade=...`.
        // Let's try the standard link approach found in 'infra_js' or by observing standard behavior.
        
        // Based on SEI source analysis (common patterns), it's often:
        // acao=infra_unidade_selecionar&id_unidade=XXXX
        
        const html = await this.client.request({
            acao: 'infra_unidade_selecionar',
            id_unidade: unitId
        });
        
        // Verify success by checking if the current unit selector now has this ID selected
        // or just by checking for errors.
        const $ = cheerio.load(html);
        const selectedId = $('#selInfraUnidades').val();
        
        return selectedId === unitId;
    }
}
