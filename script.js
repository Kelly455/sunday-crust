const form = document.getElementById('orderForm');

// Guard: if this script ever loads on a page without the form, do nothing instead of crashing.
if (form) {
  const qtyInputs = form.querySelectorAll('input[type="number"]');
  const totalEl = document.getElementById('orderTotal');
  const errorEl = document.getElementById('formError');
  const successEl = document.getElementById('formSuccess');
  const pickupInput = document.getElementById('pickup');

  // ---------- helpers ----------
  const getQty = (input) => {
    const n = parseInt(input.value, 10);
    if (isNaN(n) || n < 0) return 0;
    return Math.min(n, 20);
  };

  const calcTotal = () => {
    let total = 0;
    qtyInputs.forEach((input) => {
      total += getQty(input) * Number(input.dataset.price);
    });
    return total;
  };

  const toInputValue = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const showError = (message) => {
    errorEl.textContent = message;
    errorEl.hidden = false;
    successEl.hidden = true;
  };

  // ---------- earliest pickup date ----------
  // Rule from the About section: order by 6pm, pick up the next morning.
  const earliest = new Date();
  earliest.setDate(earliest.getDate() + (earliest.getHours() >= 18 ? 2 : 1));
  pickupInput.min = toInputValue(earliest);

  // ---------- live total ----------
  form.addEventListener('input', () => {
    totalEl.textContent = calcTotal();
    errorEl.hidden = true;
    successEl.hidden = true;
  });

    // ---------- product-card "Order" buttons ----------
  document.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.add);
      if (input && getQty(input) === 0) {
        input.value = 1;
        form.dispatchEvent(new Event('input'));
      }
    });
  });

  // ---------- submit ----------
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const total = calcTotal();
    const name = form.elements['name'].value.trim();
    const phoneDigits = form.elements['phone'].value.replace(/\D/g, '');
    const pickupValue = pickupInput.value;

    if (total === 0) {
      showError('Add at least one item to your order.');
      return;
    }
    if (name.length < 2) {
      showError('Enter your name.');
      return;
    }
    if (phoneDigits.length !== 10) {
      showError('Enter a 10-digit phone number.');
      return;
    }
    if (!pickupValue) {
      showError('Choose a pickup date.');
      return;
    }

    // Parse as a local date (new Date("2026-11-10") would be read as UTC and can land on the wrong day).
    const [y, m, d] = pickupValue.split('-').map(Number);
    const pickupDate = new Date(y, m - 1, d);

    if (pickupValue < pickupInput.min) {
      showError('Pickup must be at least the next morning after you order.');
      return;
    }
    if (pickupDate.getDay() === 1) {
      showError("We're closed on Mondays. Pick Tuesday through Sunday.");
      return;
    }

    const pretty = pickupDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    errorEl.hidden = true;
    successEl.textContent = `Thanks, ${name}! Your $${total} order is confirmed for pickup on ${pretty}. (Demo only, no payment taken.)`;
    successEl.hidden = false;

    form.reset();
    totalEl.textContent = 0;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    successEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  });
}