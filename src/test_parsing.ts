
import * as cheerio from 'cheerio';
import * as assert from 'assert';

// Mock HTML for List Processes
const mockListHtml = `
<html>
<body>
    <table id="tblProcessosRecebidos">
        <tr class="infraCaption"><td>Caption</td></tr>
        <tr class="tablesorter-headerRow"><th>Header</th></tr>
        <tr>
            <td><input type="checkbox"></td>
            <td><a href="#" onmouseover="return infraTooltipMostrar('Note Content', 'Title');"><img src="note.png"></a></td>
            <td><a href="controlador.php?acao=procedimento_trabalhar&id_procedimento=1001">12345.000001/2023-01</a></td>
            <td>User A</td>
            <td>Type A</td>
        </tr>
    </table>
</body>
</html>
`;

// Test List Processes Parsing
const $list = cheerio.load(mockListHtml);
const processes: any[] = [];
$list('#tblProcessosRecebidos').find('tr').each((i, el) => {
    const tr = $list(el);
    if (tr.hasClass('infraCaption') || tr.hasClass('tablesorter-headerRow')) return;
    const cols = tr.find('td');
    if (cols.length < 3) return;

    const protocolLink = cols.eq(2).find('a').first();
    const protocol = protocolLink.text().trim();
    const href = protocolLink.attr('href') || '';
    const id = href.split('id_procedimento=')[1];
    
    // Note Extraction
    let note = '';
    const noteIcon = cols.eq(1).find('a[onmouseover*="infraTooltipMostrar"]');
    if (noteIcon.length) {
        const match = noteIcon.attr('onmouseover')?.match(/'([^']*)'/);
        if (match) note = match[1];
    }

    if (id) {
        processes.push({ id, protocol, note });
    }
});

console.log('List Processes Test:', processes);
assert.strictEqual(processes.length, 1);
assert.strictEqual(processes[0].id, '1001');
assert.strictEqual(processes[0].note, 'Note Content');


// Mock HTML for Get Process (Tree)
const mockTreeHtml = `
<html>
<body>
    <script>
        function infraAdicionarNo() {}
        infraAdicionarNo("anchor", "doc1", "Document 1", "controlador.php?acao=doc&id_documento=5001", "target", "img_caneta.png", "root");
        infraAdicionarNo("anchor", "doc2", "Document 2", "controlador.php?acao=doc&id_documento=5002", "target", "img.png", "root");
    </script>
</body>
</html>
`;

// Test Tree Parsing
const documents: any[] = [];
const regex = /infraAdicionarNo\s*\(([^)]+)\)/g;
const scriptContent = mockTreeHtml;
let match;
while ((match = regex.exec(scriptContent)) !== null) {
    const args = match[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    const link = args[3];
    let docId = '';
    if (link) {
        const idMatch = link.match(/id_documento=(\d+)/);
        if (idMatch) docId = idMatch[1];
    }
    if (docId) {
        documents.push({
            id: docId,
            name: args[2],
            isSigned: args[5]?.includes('caneta') || false
        });
    }
}

console.log('Get Process Tree Test:', documents);
assert.strictEqual(documents.length, 2);
assert.strictEqual(documents[0].id, '5001');
assert.strictEqual(documents[0].isSigned, true);
assert.strictEqual(documents[1].id, '5002');
assert.strictEqual(documents[1].isSigned, false);

console.log('All tests passed!');
