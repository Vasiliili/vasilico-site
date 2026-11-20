const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {model, validate} = require('../statistika/price-edit-core.js');
const root = path.resolve(__dirname, '..');
const pathToPrices = path.join(root, 'pricing-data.js');

function apply(patch, source = fs.readFileSync(pathToPrices, 'utf8')) {
 const context = vm.createContext({model});
 const pricingPages = fs.readFileSync(path.join(root, 'pricing-pages.js'), 'utf8');
 vm.runInContext(source + '\n' + pricingPages, context);
 const catalog = vm.runInContext(
  'model(priceGroups, allPriceJobs, replacementJobs, servicePresets, tripPriceJob, diagnosisPriceJob)', context);
 const changes = validate(patch, catalog);
 // Keep positional IDs stable so previously shared calculator links continue to work.
 const marker = 'const allPriceJobs=';
 if (source.split(marker).length !== 2) throw Error('Не найдено место применения правок.');
 const lines = changes.map(change => {
  if (change.type === 'add') {
   const row = JSON.stringify([change.name, change.amount, change.from]);
   return `priceGroups[${change.group}][1].push(${row}); // price-editor`;
  }
  const [group, index] = change.id.split('-').map(Number);
  const row = change.type === 'remove' ? [null, 0] : [change.name, change.amount, change.from];
  return `priceGroups[${group}][1][${index}]=${JSON.stringify(row)}; // price-editor`;
 });
 return source.replace(marker, lines.join('\n') + '\n' + marker);
}

if (require.main === module) {
 try {
  const patch = JSON.parse(fs.readFileSync(process.argv[2] || 0, 'utf8'));
  fs.writeFileSync(pathToPrices, apply(patch));
 } catch (error) {
  console.error(error.message);
  process.exitCode = 1;
 }
}
module.exports = {apply};
