(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  document.querySelectorAll('[data-section]').forEach(button => {
    button.addEventListener('click', () => {
      const section = byId(button.dataset.section);
      if (!section) return;
      section.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start'});
      section.setAttribute('tabindex', '-1');
      section.focus({preventScroll: true});
    });
  });
  const form = byId('fee-form');
  if (!form) return;
  form.addEventListener('submit', event => event.preventDefault());
  const price = byId('sale-price');
  const royalty = byId('royalty');
  const gas = byId('gas');
  const fields = [price, royalty, gas];
  const rows = [...document.querySelectorAll('tr[data-rate]')];
  const format = value => value.toLocaleString('en-US', {minimumFractionDigits: 4, maximumFractionDigits: 8});
  const compact = value => value.toLocaleString('en-US', {maximumFractionDigits: 8});
  const read = input => input && input.value.trim() !== '' && input.validity.valid && Number.isFinite(Number(input.value)) ? Number(input.value) : null;
  const extraInputs = [...document.querySelectorAll('[data-offer], [data-venue-royalty], [data-venue-gas]')];
  function calculate() {
    const values = fields.map(read);
    const allInputs = [...fields, ...extraInputs];
    const invalid = allInputs.some(input => read(input) === null);
    allInputs.forEach(input => input.setAttribute('aria-invalid', String(read(input) === null)));
    const error = byId('calc-error');
    error.hidden = !invalid;
    if (invalid) {
      error.textContent = 'Enter a sale price above 0, a royalty from 0% to 98%, and gas of 0 ETH or more. Complete each offer field to compare payouts.';
      rows.forEach(row => row.querySelectorAll('[data-cell]').forEach(cell => cell.textContent = '—'));
      byId('calc-summary').textContent = 'Complete the selling costs to calculate your proceeds.';
      byId('table-basis').textContent = 'Complete the fields above';
      document.querySelectorAll('tr.best').forEach(row => row.classList.remove('ca4a4d7'));
      calculateTarget();
      return;
    }
    const [amount, royaltyRate, gasCost] = values;
    const results = rows.map(row => {
      const venue = row.dataset.venue;
      const amountInput = venue && document.querySelector('[data-offer="' + venue + '"]');
      const royaltyInput = venue && document.querySelector('[data-venue-royalty="' + venue + '"]');
      const gasInput = venue && document.querySelector('[data-venue-gas="' + venue + '"]');
      const gross = amountInput ? read(amountInput) : amount;
      const creatorRate = royaltyInput ? read(royaltyInput) : royaltyRate;
      const sellerGas = gasInput ? read(gasInput) : gasCost;
      const fee = gross * Number(row.dataset.rate) / 100;
      const creator = gross * creatorRate / 100;
      const net = gross - fee - creator - sellerGas;
      row.querySelector('[data-cell="fee"]').textContent = format(fee);
      row.querySelector('[data-cell="royalty"]').textContent = format(creator);
      row.querySelector('[data-cell="gas"]').textContent = format(sellerGas);
      row.querySelector('[data-cell="net"]').textContent = format(net) + ' ETH';
      return {row, net, name: row.querySelector('th').textContent};
    });
    const highest = Math.max(...results.map(result => result.net));
    const lowest = Math.min(...results.map(result => result.net));
    results.forEach(result => result.row.classList.toggle('ca4a4d7', Math.abs(result.net - highest) < 1e-12));
    byId('table-basis').textContent = extraInputs.length ? 'Individual marketplace offers and selling costs' : compact(amount) + ' ETH sale · ' + compact(royaltyRate) + '% royalty · ' + compact(gasCost) + ' ETH seller gas';
    const summary = byId('calc-summary');
    summary.replaceChildren();
    const strong = document.createElement('strong');
    strong.textContent = format(highest - lowest) + ' ETH separates the highest and lowest payout.';
    summary.append(strong, ' Compare buyer offers as well as fees: a higher offer can cover a higher platform fee.');
    if (lowest < 0) {
      error.hidden = false;
      error.textContent = 'Selling costs exceed the price for at least one marketplace. The negative result shows the amount you would spend beyond the sale proceeds.';
    }
    calculateTarget();
  }
  function calculateTarget() {
    const target = byId('target-payout');
    if (!target) return;
    const venue = byId('target-market').value;
    const targetRoyalty = document.querySelector('[data-venue-royalty="' + venue + '"]');
    const targetGas = document.querySelector('[data-venue-gas="' + venue + '"]');
    const desired = read(target);
    const creatorRate = read(targetRoyalty);
    const sellerGas = read(targetGas);
    const rate = Number(document.querySelector('tr[data-venue="' + venue + '"]').dataset.rate);
    const denominator = 1 - (rate + creatorRate) / 100;
    target.setAttribute('aria-invalid', String(desired === null));
    if (desired === null || creatorRate === null || sellerGas === null || denominator <= 0) {
      byId('target-amount').textContent = '—';
      byId('target-explanation').textContent = 'Enter a positive target and selling costs below 100% to calculate your asking price.';
      return;
    }
    const needed = Math.ceil(((desired + sellerGas) / denominator) * 1e8) / 1e8;
    byId('target-amount').textContent = format(needed) + ' ETH';
    byId('target-explanation').textContent = 'Asking price to keep ' + compact(desired) + ' ETH on ' + byId('target-market').selectedOptions[0].textContent + ', including ' + compact(creatorRate) + '% royalty and ' + compact(sellerGas) + ' ETH seller gas. Rounded up to 8 decimal places.';
  }
  fields.forEach(input => input.addEventListener('input', () => {
    if (extraInputs.length) {
      const selector = input === price ? '[data-offer]' : input === royalty ? '[data-venue-royalty]' : '[data-venue-gas]';
      document.querySelectorAll(selector).forEach(venueInput => venueInput.value = input.value);
    }
    calculate();
  }));
  extraInputs.forEach(input => input.addEventListener('input', calculate));
  ['target-payout', 'target-market'].forEach(id => byId(id)?.addEventListener('input', calculateTarget));
  const storageKey = 'nft-sale-comparison';
  const status = byId('save-status');
  const saveFields = [...fields, ...extraInputs, byId('target-payout'), byId('target-market')].filter(Boolean);
  if (status) {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && typeof saved === 'object') {
        saveFields.forEach(input => {
          if (typeof saved[input.id] === 'string') input.value = saved[input.id];
        });
        status.textContent = 'Your saved comparison is loaded.';
      }
    } catch { status.textContent = 'Your comparison is ready to edit.'; }
    byId('save-comparison').addEventListener('click', () => {
      const invalid = saveFields.find(input => !input.checkValidity());
      if (invalid) {
        invalid.reportValidity();
        status.textContent = 'Complete the highlighted field before saving.';
        return;
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(saveFields.map(input => [input.id, input.value]))));
        status.textContent = 'Comparison saved in this browser.';
      } catch { status.textContent = 'Browser storage is unavailable. Keep this tab open to retain your entries.'; }
    });
    byId('reset-comparison').addEventListener('click', () => {
      saveFields.forEach(input => input.value = input.tagName === 'SELECT' ? input.options[0].value : input.defaultValue);
      try { localStorage.removeItem(storageKey); } catch {}
      status.textContent = 'Starting values restored.';
      calculate();
    });
  }
  calculate();
})();
