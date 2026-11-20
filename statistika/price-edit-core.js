const vasilicoPriceEditor = (() => {
 const idPattern = /^\d+-\d+$/;
 const validAmount = amount => Number.isInteger(amount) && amount >= 0 && amount <= 1_000_000;
 const validName = name => typeof name === 'string' && name === name.trim() &&
  name.length >= 3 && name.length <= 130 && /^[\p{L}\p{N} .,:;()!?+/%№–—-]+$/u.test(name);

 function model(groups, jobs, replacements, presets, trip, diagnosis) {
  const required = new Set([
   ...replacements.flatMap(item => item.jobs), trip.id, diagnosis.id,
   ...jobs.filter(job => Object.values(presets).some(names => names.includes(job.name))).map(job => job.id)
  ]);
  return {groups: groups.map(([name], id) => ({id, name})).filter(group => group.name),
   jobs: jobs.map(job => ({id: job.id, name: job.name, group: job.group, amount: job.amount, from: job.from,
    required: required.has(job.id)}))};
 }

 function validate(patch, {groups, jobs}) {
  if (patch?.version !== 1 || !Array.isArray(patch.changes) || !patch.changes.length || patch.changes.length > 50)
   throw Error('В пакете должно быть от 1 до 50 правок.');
  const used = new Set();
  const names = new Set(jobs.map(job => job.name.toLocaleLowerCase('ru')));
  return patch.changes.map(change => {
   if (change?.type === 'add') {
    const {group, name, amount, from} = change;
    if (!groups.some(item => item.id === group) || !validName(name) || !validAmount(amount) || typeof from !== 'boolean')
     throw Error('Проверьте раздел, название и цену новой позиции.');
    const key = name.toLocaleLowerCase('ru');
    if (names.has(key)) throw Error('Позиция с таким названием уже есть: ' + name);
    names.add(key);
    return {type: 'add', group, name, amount, from};
   }
   const job = jobs.find(item => item.id === change?.id);
   if (!job || !idPattern.test(change.id) || used.has(change.id) || job.name !== change.name ||
       job.amount !== change.previousAmount || job.from !== change.previousFrom)
    throw Error('Прайс изменился. Откройте актуальную версию и повторите правку.');
   used.add(change.id);
   const base = {id: job.id, name: job.name, previousAmount: job.amount, previousFrom: job.from};
   if (change.type === 'remove' && !job.required) return {type: 'remove', ...base};
   if (change.type === 'update' && validAmount(change.amount) && typeof change.from === 'boolean')
    return {type: 'update', ...base, amount: change.amount, from: change.from};
   throw Error('Эту правку нельзя применить: ' + job.name);
  });
 }
 return {model, validate};
})();
if (typeof module === 'object') module.exports = vasilicoPriceEditor;
