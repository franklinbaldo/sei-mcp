import { SeiClient } from '../sei-client.js';

export class DownloadFeature {
    constructor(private client: SeiClient) {}

    /**
     * Downloads a file.
     * In SEI, the download link is typically:
     * controlador.php?acao=documento_download_anexo&id_documento=...&id_anexo=...
     * OR simply opening the document link with a specific header or scraping the "Download" button from the document view.
     * 
     * Reliable method:
     * 1. Access `acao=documento_visualizar&id_documento=...`
     * 2. Look for the download link/button.
     * 3. OR try direct `acao=documento_download_anexo`.
     */
    async download(documentId: string, protocolId: string): Promise<{ filename: string, content: Buffer }> {
        // Direct download URL attempt
        // Common endpoint: acao=documento_download&id_documento=...
        // Note: id_procedimento might be required for context.
        
        // Let's try to hit the document visualization first to ensure permission/context
        await this.client.request({
            acao: 'documento_visualizar',
            id_documento: documentId,
            id_procedimento: protocolId
        });

        // Now try the download action
        const response = await this.client.requestRaw({
            acao: 'documento_download_anexo',
            id_documento: documentId,
            id_procedimento: protocolId
        });

        // Extract filename from Content-Disposition
        let filename = `document_${documentId}.pdf`; // default
        const disposition = response.headers['content-disposition'];
        if (disposition) {
            const match = disposition.match(/filename="?([^"]+)"?/);
            if (match) {
                filename = match[1];
            }
        }

        return {
            filename,
            content: response.data
        };
    }
}
