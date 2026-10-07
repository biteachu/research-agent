// Self-authored ASCII fixture. No paper, personal data, or additional dependency.
import {writeFile,mkdir} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const folder=dirname(fileURLToPath(import.meta.url));
const stream=`BT /F1 14 Tf 40 610 Td (Synthetic parser example) Tj ET
BT /F1 12 Tf 40 575 Td (Table 1. Numeric cells) Tj ET
40 450 300 100 re S
40 525 m 340 525 l S 40 500 m 340 500 l S 40 475 m 340 475 l S
140 450 m 140 525 l S 240 450 m 240 525 l S
BT /F1 12 Tf 70 533 Td (Merged heading) Tj ET
BT /F1 12 Tf 50 507 Td (Condition) Tj 105 0 Td (Score) Tj 105 0 Td (Count) Tj ET
BT /F1 12 Tf 50 482 Td (A) Tj 105 0 Td (12.5) Tj 105 0 Td (30) Tj ET
BT /F1 12 Tf 50 457 Td (B) Tj 105 0 Td (14.0) Tj 105 0 Td (28) Tj ET
BT /F1 12 Tf 40 400 Td (Equation:) Tj ET
BT /F1 12 Tf 40 375 Td (E = mc) Tj /F1 8 Tf 5 Ts (2) Tj ET
50 270 70 50 re S 200 270 70 50 re S 120 295 m 200 295 l S
BT /F1 12 Tf 40 240 Td (Figure 1. Two boxes connected by a line) Tj ET`;
const objects=[
'<< /Type /Catalog /Pages 2 0 R >>',
'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 500 650] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`
];
let pdf='%PDF-1.4\n',offsets=[0];
for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`;}
const xref=Buffer.byteLength(pdf);
pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
for(const n of offsets.slice(1))pdf+=`${String(n).padStart(10,'0')} 00000 n \n`;
pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
await mkdir(folder,{recursive:true});await writeFile(join(folder,'demo.pdf'),pdf);
console.log('Created examples/demo.pdf (synthetic; excluded from Git).');
