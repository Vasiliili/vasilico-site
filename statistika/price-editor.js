(() => {
 const editor = document.getElementById('price-editor');
 const form = document.getElementById('price-entry');
 const search = document.getElementById('price-search');
 const matches = document.getElementById('price-matches');
 const status = document.getElementById('price-status');
 const draft = document.getElementById('price-draft');
 const output = document.getElementById('price-patch');
 const category = document.getElementById('price-category');
 const name = document.getElementById('price-name');
 const amount = document.getElementById('price-amount');
 const from = document.getElementById('price-from');
 const remove = document.getElementById('price-remove');
 const changes = [];
 const fold = value => value.toLocaleLowerCase('ru').replaceAll('ё','е').replaceAll('ь','');
 const catalog = vasilicoPriceEditor.model(priceGroups, allPriceJobs, replacementJobs,
  servicePresets, tripPriceJob, diagnosisPriceJob);
 let active = null;
 let editing = null;

 function button(label, action) {
  const control = document.createElement('button');
  control.type = 'button';
  control.textContent = label;
  control.onclick = action;
  return control;
 }

 for (const group of catalog.groups) category.add(new Option(group.name, group.id));
 function result(group) {
  return catalog.groups.find(item => item.id === group)?.name;
 }
 function renderSearch() {
  const terms = fold(search.value).trim().split(/\s+/).filter(Boolean);
  matches.replaceChildren();
  if (!terms.length) return;
  const jobs = catalog.jobs.filter(job =>
   terms.every(term => fold(job.name + ' ' + result(job.group)).includes(term)));
  for (const job of jobs.slice(0, 12)) {
   const row = changes.findIndex(change => change.id === job.id);
   matches.append(button(job.name + ' · ' + (job.from ? 'от ' : '') + priceMoney(job.amount), () =>
    start(job, row === -1 ? null : row)));
  }
  if (!jobs.length) matches.textContent = 'Совпадений нет.';
  if (jobs.length > 12) matches.append('Уточните поиск, чтобы увидеть остальные позиции.');
 }
 function start(job, index = null) {
  const change = index === null ? null : changes[index];
  active = job;
  editing = index;
  form.hidden = false;
  name.readOnly = category.disabled = Boolean(job);
  name.value = job?.name ?? change?.name ?? '';
  category.value = String(job?.group ?? change?.group ?? catalog.groups[0].id);
  amount.value = change?.amount ?? job?.amount ?? '';
  from.checked = change?.from ?? job?.from ?? true;
  remove.hidden = !job || job.required;
  document.getElementById('price-remove-note').hidden = !job?.required;
  (job ? amount : name).focus();
 }
 function renderDraft() {
  draft.replaceChildren();
  for (const [index, change] of changes.entries()) {
   const row = document.createElement('li');
   const label = change.type === 'remove' ? 'Убрать ' + change.name :
    (change.type === 'add' ? 'Добавить ' : '') + change.name + ' · ' +
    (change.from ? 'от ' : '') + priceMoney(change.amount);
   row.append(document.createTextNode(label + ' '),
    button('Отменить правку', () => {
     changes.splice(index, 1);
     form.hidden = true;
     renderDraft();
    }));
   draft.append(row);
  }
  output.value = changes.length ? JSON.stringify({version: 1, changes}) : '';
  document.getElementById('price-publish').hidden = !changes.length;
 }
 function queue(change) {
  const next = [...changes];
  if (editing === null) next.push(change);
  else next[editing] = change;
  try {
   const validated = vasilicoPriceEditor.validate({version: 1, changes: next}, catalog);
   changes.splice(0, changes.length, ...validated);
   form.hidden = true;
   status.textContent = 'Правка в черновике.';
   renderDraft();
  } catch (error) { status.textContent = error.message; }
 }
 const state = () => ({id: active.id, name: active.name, previousAmount: active.amount, previousFrom: active.from});
 search.addEventListener('input', renderSearch);
 document.getElementById('price-add').onclick = () => start(null);
 document.getElementById('price-cancel').onclick = () => { form.hidden = true; };
 form.onsubmit = event => {
  event.preventDefault();
  const price = {amount: amount.valueAsNumber, from: from.checked};
  queue(active ? {type: 'update', ...state(), ...price} :
   {type: 'add', group: Number(category.value), name: name.value.trim(), ...price});
 };
 remove.onclick = () => queue({type: 'remove', ...state()});
 document.getElementById('price-copy').onclick = async () => {
  try {
   await navigator.clipboard.writeText(output.value);
   status.textContent = 'Правки скопированы.';
  } catch {
   output.focus();
   output.select();
   status.textContent = 'Правки выделены. Скопируйте их.';
  }
 };
 window.vasilicoPriceEditorVisible = visible => {
  editor.hidden = !visible;
  if (visible) return;
  changes.length = 0;
  form.hidden = true;
  search.value = '';
  status.textContent = '';
  renderSearch();
  renderDraft();
 };
})();
