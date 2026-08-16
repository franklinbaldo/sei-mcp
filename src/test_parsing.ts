import * as assert from 'assert';
import { parseProcessListHtml } from './features/list-processes.js';
import { parseDocumentTreeHtml } from './features/get-process.js';

const mockListHtml = `
<html><body>
<table id="tblProcessosRecebidos"><tbody>
<tr class="infraCaption"><td>Caption</td></tr>
<tr class="tablesorter-headerRow"><th>Header</th></tr>
<tr>
<td><input type="checkbox"></td>
<td><a href="#" onmouseover="return infraTooltipMostrar('Note Content', 'Title');"><img src="note.png"></a></td>
<td><a href="controlador.php?acao=procedimento_trabalhar&id_procedimento=1001">12345.000001/2023-01</a></td>
<td>User A</td><td>Type A</td>
</tr>
</tbody></table>
</body></html>`;

const processes = parseProcessListHtml(mockListHtml);
assert.strictEqual(processes.length, 1);
assert.strictEqual(processes[0].id, '1001');
assert.strictEqual(processes[0].protocol, '12345.000001/2023-01');
assert.strictEqual(processes[0].status, 'Recebido');
assert.deepStrictEqual(processes[0].interested, ['User A']);
assert.strictEqual(processes[0].note, 'Note Content');

const mockTreeHtml = `
<html><body><script>
function infraAdicionarNo() {}
infraAdicionarNo("anchor", "doc1", "Document 1", "controlador.php?acao=doc&id_documento=5001", "target", "img_caneta.png", "root");
infraAdicionarNo("anchor", "doc2", "Document 2", "controlador.php?acao=doc&id_documento=5002", "target", "img.png", "root");
</script></body></html>`;

const documents = parseDocumentTreeHtml(mockTreeHtml, '1001');
assert.strictEqual(documents.length, 2);
assert.strictEqual(documents[0].id, '5001');
assert.strictEqual(documents[0].protocolId, '1001');
assert.strictEqual(documents[0].isSigned, true);
assert.strictEqual(documents[1].id, '5002');
assert.strictEqual(documents[1].isSigned, false);

console.log('Production parser tests passed!');
