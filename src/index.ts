import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as dotenv from 'dotenv';
import { SeiClient } from './sei-client.js';
import { ListProcessesFeature } from './features/list-processes.js';
import { GetProcessFeature } from './features/get-process.js';
import { DownloadFeature } from './features/download.js';
import { SwitchUnitFeature } from './features/switch-unit.js';
import { SearchFeature } from './features/search.js';

dotenv.config();

// Config check
const SEI_URL = process.env.SEI_URL;
const SEI_COOKIES = process.env.SEI_COOKIES; // Expects "PHPSESSID=...; sei_path=..."

if (!SEI_URL || !SEI_COOKIES) {
    console.error("Error: SEI_URL and SEI_COOKIES environment variables must be set.");
    process.exit(1);
}

// Initialize Client
const client = new SeiClient({
    baseUrl: SEI_URL,
    cookieString: SEI_COOKIES
});

// Initialize Features
const listProcessesFeature = new ListProcessesFeature(client);
const getProcessFeature = new GetProcessFeature(client);
const downloadFeature = new DownloadFeature(client);
const switchUnitFeature = new SwitchUnitFeature(client);
const searchFeature = new SearchFeature(client);

// Create server
const server = new McpServer({
    name: "sei-mcp-server",
    version: "1.0.0"
});

// Register Tools

server.tool(
    "sei_list_processes",
    "List processes in the current unit's inbox (Recebidos/Gerados).",
    {},
    async () => {
        const processes = await listProcessesFeature.listProcesses();
        return {
            content: [{
                type: "text",
                text: JSON.stringify(processes, null, 2)
            }]
        };
    }
);

server.tool(
    "sei_get_process",
    "Get details and document tree of a specific process.",
    {
        protocolId: z.string().describe("The internal ID (id_procedimento) of the process.")
    },
    async ({ protocolId }) => {
        const details = await getProcessFeature.getProcess(protocolId);
        return {
            content: [{
                type: "text",
                text: JSON.stringify(details, null, 2)
            }]
        };
    }
);

server.tool(
    "sei_download_document",
    "Download a specific document from a process.",
    {
        documentId: z.string().describe("The internal ID (id_documento) of the document."),
        protocolId: z.string().describe("The internal ID (id_procedimento) of the process context.")
    },
    async ({ documentId, protocolId }) => {
        const result = await downloadFeature.download(documentId, protocolId);
        // For MCP text response, we might need to base64 encode or just return a message.
        // Ideally, MCP supports resources, but for a tool call we usually return text.
        // Let's return a base64 string for small files or a summary.
        // WARNING: Large files might crash the JSON response.
        const base64 = result.content.toString('base64');
        
        return {
            content: [{
                type: "text",
                text: `Filename: ${result.filename}\nBase64 Data (truncated preview): ${base64.substring(0, 50)}...\nFull data in 'data' field.`,
            }, {
                type: "text", // returning full base64 in a separate block or relying on the client to handle it
                text: base64
            }]
        };
    }
);

server.tool(
    "sei_search_process",
    "Search for a process by number or keyword.",
    {
        query: z.string().describe("The protocol number or keyword to search.")
    },
    async ({ query }) => {
        const results = await searchFeature.search(query);
        return {
            content: [{
                type: "text",
                text: JSON.stringify(results, null, 2)
            }]
        };
    }
);

server.tool(
    "sei_list_units",
    "List available units to switch to.",
    {},
    async () => {
        const units = await switchUnitFeature.listUnits();
        return {
            content: [{
                type: "text",
                text: JSON.stringify(units, null, 2)
            }]
        };
    }
);

server.tool(
    "sei_switch_unit",
    "Switch the active unit for the session.",
    {
        unitId: z.string().describe("The ID of the unit to switch to.")
    },
    async ({ unitId }) => {
        const success = await switchUnitFeature.switchUnit(unitId);
        return {
            content: [{
                type: "text",
                text: success ? `Successfully switched to unit ID ${unitId}` : `Failed to switch to unit ID ${unitId}`
            }]
        };
    }
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("SEI MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main loop:", error);
    process.exit(1);
});
