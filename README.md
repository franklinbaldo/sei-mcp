# SEI MCP Server

This is a Model Context Protocol (MCP) server that acts as a bridge to the **Sistema Eletrônico de Informações (SEI)**. It allows an AI agent to interact with SEI to list processes, read documents, search, and download files.

## Prerequisites

*   Node.js (v18+)
*   Access to a SEI instance.
*   **Authentication Cookies**: Since SEI often uses complex SSO (like Gov.br or "Meu Acesso"), this server relies on reusing an existing session. You must extract your `PHPSESSID` and other relevant cookies (e.g., `sei_path`) from your browser.

## Configuration

Create a `.env` file in the root directory (or set environment variables) with:

```env
SEI_URL=https://sei.sistemas.ro.gov.br/sei/
SEI_COOKIES="PHPSESSID=your_session_id_here; sei_path=..."
```

**How to get the Cookies:**
1.  Log in to SEI in your browser (Chrome/Firefox).
2.  Open Developer Tools (F12) -> Network tab.
3.  Refresh the page (e.g., the main "Controle de Processos").
4.  Click on the request to `controlador.php`.
5.  Look at the "Request Headers" section.
6.  Copy the entire value of the `Cookie:` header.

## Build

```bash
cd sei-mcp-server
npm install
npm run build
```

## Running the Server

```bash
node dist/index.js
```

## Tools Available

*   `sei_list_processes`: Lists processes in the "Recebidos" and "Gerados" tables of the current unit.
*   `sei_get_process`: Retrieves details and the document tree of a specific process.
*   `sei_download_document`: Downloads the content of a document (PDF, etc.) as Base64.
*   `sei_search_process`: Searches for a process by protocol number or keyword.
*   `sei_list_units`: Lists available units to switch to.
*   `sei_switch_unit`: Switches the active unit for the session.

## Notes

*   This server uses standard HTML scraping (Cheerio) to interact with SEI, mimicking the behavior of browser extensions like "SEI Pro".
*   If the session expires, you will need to update the `SEI_COOKIES` in the `.env` file.
