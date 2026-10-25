/**
 * Small DOM UI helpers: modal dialogs, toasts, menus and formatting.
 */

export type FieldType = 'text' | 'number' | 'select' | 'checkbox' | 'label' | 'password';

export interface SelectOption {
  label: string;
  value: string | number | boolean;
}

export interface DialogField {
  key: string;
  label?: string;
  type: FieldType;
  value?: string | number | boolean;
  options?: SelectOption[];
  // (boolean values are used by the outside/inside and centre/fill selects)
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  placeholder?: string;
  help?: string;
  disabled?: boolean;
  wide?: boolean;
}

export type DialogValues = Record<string, string | number | boolean>;

export interface DialogOptions {
  title: string;
  description?: string;
  fields: DialogField[];
  submitLabel?: string;
  cancelLabel?: string;
  wide?: boolean;
  validate?: (values: DialogValues) => string | null;
}

let activeOverlay: HTMLElement | null = null;

export function openDialog(options: DialogOptions): Promise<DialogValues | null> {
  return new Promise((resolve) => {
    if (activeOverlay) activeOverlay.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'modal' + (options.wide ? ' modal-wide' : '');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    const header = document.createElement('div');
    header.className = 'modal-header';
    const title = document.createElement('h2');
    title.textContent = options.title;
    header.appendChild(title);
    const closeBtn = document.createElement('button');
    closeBtn.className = 'icon-button modal-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';
    header.appendChild(closeBtn);
    modal.appendChild(header);

    if (options.description) {
      const desc = document.createElement('p');
      desc.className = 'modal-description';
      desc.textContent = options.description;
      modal.appendChild(desc);
    }

    const form = document.createElement('form');
    form.className = 'modal-form';
    form.noValidate = true;
    const grid = document.createElement('div');
    grid.className = 'field-grid';
    form.appendChild(grid);

    const inputs = new Map<string, HTMLInputElement | HTMLSelectElement>();
    const checkboxes = new Map<string, HTMLInputElement>();

    for (const field of options.fields) {
      if (field.type === 'label') {
        const el = document.createElement('div');
        el.className = 'field-label-note';
        if (field.wide) el.classList.add('span-2');
        el.textContent = field.label || '';
        grid.appendChild(el);
        continue;
      }
      const wrap = document.createElement('label');
      wrap.className = 'field';
      if (field.wide) wrap.classList.add('span-2');
      const labelText = document.createElement('span');
      labelText.className = 'field-label';
      labelText.textContent = field.label || field.key;
      wrap.appendChild(labelText);

      let input: HTMLInputElement | HTMLSelectElement;
      if (field.type === 'select') {
        const sel = document.createElement('select');
        for (const opt of field.options || []) {
          const o = document.createElement('option');
          o.value = String(opt.value);
          o.textContent = opt.label;
          sel.appendChild(o);
        }
        if (field.value !== undefined) sel.value = String(field.value);
        if (field.disabled) sel.disabled = true;
        input = sel;
      } else if (field.type === 'checkbox') {
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !!field.value;
        cb.disabled = !!field.disabled;
        input = cb;
        checkboxes.set(field.key, cb);
        wrap.classList.add('field-checkbox');
      } else {
        const inp = document.createElement('input');
        inp.type = field.type === 'number' ? 'number' : field.type;
        if (field.value !== undefined) inp.value = String(field.value);
        if (field.min !== undefined) inp.min = String(field.min);
        if (field.max !== undefined) inp.max = String(field.max);
        if (field.step !== undefined) inp.step = String(field.step);
        if (field.placeholder) inp.placeholder = field.placeholder;
        if (field.disabled) inp.disabled = true;
        input = inp;
      }
      input.name = field.key;

      if (field.suffix) {
        const row = document.createElement('div');
        row.className = 'input-row';
        row.appendChild(input);
        const suffix = document.createElement('span');
        suffix.className = 'input-suffix';
        suffix.textContent = field.suffix;
        row.appendChild(suffix);
        wrap.appendChild(row);
      } else {
        wrap.appendChild(input);
      }
      if (field.help) {
        const help = document.createElement('span');
        help.className = 'field-help';
        help.textContent = field.help;
        wrap.appendChild(help);
      }
      grid.appendChild(wrap);
      if (field.type !== 'checkbox') inputs.set(field.key, input);
      else inputs.set(field.key, input);
    }

    const errorEl = document.createElement('div');
    errorEl.className = 'modal-error';
    errorEl.hidden = true;
    form.appendChild(errorEl);

    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'button';
    cancel.textContent = options.cancelLabel || 'Cancel';
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'button primary';
    submit.textContent = options.submitLabel || 'OK';
    actions.appendChild(cancel);
    actions.appendChild(submit);
    form.appendChild(actions);
    modal.appendChild(form);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    activeOverlay = overlay;

    const firstInput = Array.from(inputs.values()).find((i) => !i.disabled);
    setTimeout(() => firstInput?.focus(), 30);

    const close = (result: DialogValues | null) => {
      overlay.remove();
      if (activeOverlay === overlay) activeOverlay = null;
      document.removeEventListener('keydown', onKey);
      resolve(result);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(null);
      }
    };
    document.addEventListener('keydown', onKey);
    closeBtn.addEventListener('click', () => close(null));
    cancel.addEventListener('click', () => close(null));
    overlay.addEventListener('pointerdown', (e) => {
      if (e.target === overlay) close(null);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const values: DialogValues = {};
      for (const field of options.fields) {
        if (field.type === 'label') continue;
        const input = inputs.get(field.key)!;
        if (field.type === 'checkbox') values[field.key] = (input as HTMLInputElement).checked;
        else if (field.type === 'number') {
          const raw = (input as HTMLInputElement).value.trim();
          values[field.key] = raw === '' ? NaN : Number(raw);
        } else if (field.type === 'select') {
          const sel = input as HTMLSelectElement;
          const opt = (field.options || []).find((o) => String(o.value) === sel.value);
          values[field.key] = opt ? opt.value : sel.value;
        } else {
          values[field.key] = (input as HTMLInputElement).value;
        }
      }
      if (options.validate) {
        const err = options.validate(values);
        if (err) {
          errorEl.textContent = err;
          errorEl.hidden = false;
          return;
        }
      }
      close(values);
    });
  });
}

export function showToast(message: string, kind: 'info' | 'success' | 'warning' | 'error' = 'info', timeout = 3800): void {
  const container = document.getElementById('toasts');
  if (!container) return;
  // Keep the stack compact so it never covers the drawing.
  while (container.children.length >= 4) container.firstElementChild?.remove();
  const toast = document.createElement('div');
  toast.className = `toast toast-${kind}`;
  toast.textContent = message;
  toast.addEventListener('click', () => toast.remove());
  container.appendChild(toast);
  window.setTimeout(() => {
    toast.classList.add('toast-out');
    window.setTimeout(() => toast.remove(), 300);
  }, timeout);
}

export function confirmDialog(message: string, title = 'Confirm'): Promise<boolean> {
  return openDialog({
    title,
    description: message,
    fields: [],
    submitLabel: 'Continue',
  }).then((v) => v !== null);
}

export function showError(title: string, message: string): void {
  void openDialog({
    title,
    description: message,
    fields: [],
    submitLabel: 'Close',
  });
}

/* ------------------------------------------------------------------ */
/* Menus                                                               */
/* ------------------------------------------------------------------ */

export function initMenus(onCommand: (command: string) => void): void {
  const menuButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-menu]'));
  const dropdowns = new Map<string, HTMLElement>();
  for (const btn of menuButtons) {
    const id = btn.dataset.menu!;
    const dd = document.querySelector<HTMLElement>(`[data-dropdown="${id}"]`);
    if (dd) dropdowns.set(id, dd);
  }

  let openMenu: string | null = null;

  const closeAll = () => {
    openMenu = null;
    for (const btn of menuButtons) btn.classList.remove('open');
    for (const dd of dropdowns.values()) dd.classList.remove('open');
  };

  const open = (id: string) => {
    closeAll();
    openMenu = id;
    const btn = menuButtons.find((b) => b.dataset.menu === id);
    const dd = dropdowns.get(id);
    if (!btn || !dd) return;
    btn.classList.add('open');
    dd.classList.add('open');
    // Fixed positioning keeps dropdowns inside the viewport even when the
    // header scrolls horizontally on narrow screens.
    const r = btn.getBoundingClientRect();
    dd.style.position = 'fixed';
    dd.style.top = `${Math.round(r.bottom + 4)}px`;
    const width = dd.offsetWidth || 250;
    const left = Math.min(r.left, window.innerWidth - width - 8);
    dd.style.left = `${Math.max(8, Math.round(left))}px`;
  };

  for (const btn of menuButtons) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.menu!;
      if (openMenu === id) closeAll();
      else open(id);
    });
    btn.addEventListener('mouseenter', () => {
      if (openMenu && openMenu !== btn.dataset.menu) open(btn.dataset.menu!);
    });
  }

  for (const dd of dropdowns.values()) {
    dd.addEventListener('click', (e) => {
      const item = (e.target as HTMLElement).closest<HTMLElement>('[data-command]');
      if (!item) return;
      e.stopPropagation();
      closeAll();
      onCommand(item.dataset.command!);
    });
  }

  document.addEventListener('click', closeAll);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });
}

export function setActiveToolButton(tool: string): void {
  for (const btn of Array.from(document.querySelectorAll<HTMLButtonElement>('[data-tool]'))) {
    btn.classList.toggle('active', btn.dataset.tool === tool);
  }
}
