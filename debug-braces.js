const fs = require('fs');
const content = fs.readFileSync('./frontend/script.js', 'utf8');
const lines = content.split('\n');

let open = 0, close = 0;
const issues = [];

lines.forEach((line, idx) => {
    const o = (line.match(/\{/g) || []).length;
    const c = (line.match(/\}/g) || []).length;
    open += o;
    close += c;
    
    if (o !== c || (open - close > 3 && idx > 700)) {
        console.log(`${idx+1}: +${o} -${c} = balance:${open-close} | ${line.substring(0, 80)}`);
    }
});

console.log(`\nFinal: Open=${open}, Close=${close}, Difference=${open-close}`);
