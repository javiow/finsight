/* @ds-bundle: {"format":4,"namespace":"FinsightDesignSystem_9bfd03","components":[{"name":"AmountDisplay","sourcePath":"components/data-display/AmountDisplay.jsx"},{"name":"Card","sourcePath":"components/data-display/Card.jsx"},{"name":"ProgressBar","sourcePath":"components/data-display/ProgressBar.jsx"},{"name":"StatCard","sourcePath":"components/data-display/StatCard.jsx"},{"name":"TransactionRow","sourcePath":"components/data-display/TransactionRow.jsx"},{"name":"Badge","sourcePath":"components/feedback/Badge.jsx"},{"name":"Tag","sourcePath":"components/feedback/Tag.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Sidebar","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"Dialog","sourcePath":"components/overlay/Dialog.jsx"}],"sourceHashes":{"components/data-display/AmountDisplay.jsx":"c29ff6ea2d39","components/data-display/Card.jsx":"f82b7d09bd8e","components/data-display/ProgressBar.jsx":"709b5996f2e5","components/data-display/StatCard.jsx":"d17e8c3efa32","components/data-display/TransactionRow.jsx":"ae8658aaaf5f","components/feedback/Badge.jsx":"92a35902ac18","components/feedback/Tag.jsx":"d5c51c2fb281","components/feedback/Toast.jsx":"332a78813fd7","components/feedback/Tooltip.jsx":"b80b70e3f1d7","components/forms/Button.jsx":"41a51748f26f","components/forms/Checkbox.jsx":"ee0264bc90f9","components/forms/Input.jsx":"0865bfa55dad","components/forms/Select.jsx":"af33cc45c934","components/forms/Switch.jsx":"d3f1557015e5","components/navigation/Sidebar.jsx":"a231a01fbc5a","components/navigation/Tabs.jsx":"254995fb4275","components/overlay/Dialog.jsx":"c4c8bf15675f","ui_kits/web-dashboard/Budgets.jsx":"7da67711875c","ui_kits/web-dashboard/Dashboard.jsx":"4ead055bdbd5","ui_kits/web-dashboard/Login.jsx":"73ded9f1c3a0","ui_kits/web-dashboard/Transactions.jsx":"53592e9ce8d0"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.FinsightDesignSystem_9bfd03 = window.FinsightDesignSystem_9bfd03 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/data-display/AmountDisplay.jsx
try { (() => {
function AmountDisplay({
  value,
  size = 'lg',
  tone = 'ink'
}) {
  const colors = {
    ink: 'var(--color-ink)',
    success: 'var(--color-success)',
    danger: 'var(--color-danger)',
    muted: 'var(--color-muted)'
  };
  const font = size === 'lg' ? 'var(--text-number-lg)' : size === 'md' ? 'var(--text-number-md)' : 'var(--text-number-sm)';
  return React.createElement('span', {
    style: {
      font,
      color: colors[tone],
      fontFamily: 'var(--font-mono)'
    }
  }, value);
}
Object.assign(__ds_scope, { AmountDisplay });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/AmountDisplay.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Card.jsx
try { (() => {
function Card({
  children,
  padded = true
}) {
  return React.createElement('div', {
    style: {
      background: 'var(--color-canvas)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-sm)',
      padding: padded ? 'var(--space-xl)' : 0,
      fontFamily: 'var(--font-sans)'
    }
  }, children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Card.jsx", error: String((e && e.message) || e) }); }

// components/data-display/ProgressBar.jsx
try { (() => {
function ProgressBar({
  label,
  value = 0,
  max = 100,
  tone = 'primary'
}) {
  const pct = Math.min(100, value / max * 100);
  const color = tone === 'danger' ? 'var(--color-danger)' : tone === 'warning' ? 'var(--color-warning)' : 'var(--color-primary)';
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      fontFamily: 'var(--font-sans)'
    }
  }, label && React.createElement('div', {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      font: 'var(--text-body-sm)',
      color: 'var(--color-body)'
    }
  }, React.createElement('span', null, label), React.createElement('span', null, Math.round(pct) + '%')), React.createElement('div', {
    style: {
      height: 8,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--color-surface-strong)',
      overflow: 'hidden'
    }
  }, React.createElement('div', {
    style: {
      height: '100%',
      width: pct + '%',
      background: color,
      borderRadius: 'var(--radius-pill)',
      transition: 'width .3s ease'
    }
  })));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/data-display/StatCard.jsx
try { (() => {
function StatCard({
  label,
  value,
  delta,
  tone = 'neutral'
}) {
  const toneColor = tone === 'success' ? 'var(--color-success)' : tone === 'danger' ? 'var(--color-danger)' : 'var(--color-muted)';
  return React.createElement('div', {
    style: {
      background: 'var(--color-canvas)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-sm)',
      padding: 'var(--space-xl)',
      fontFamily: 'var(--font-sans)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      width: '100%',
      boxSizing: 'border-box'
    }
  }, React.createElement('span', {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--color-muted)'
    }
  }, label), React.createElement('span', {
    style: {
      font: 'var(--text-number-lg)',
      color: 'var(--color-ink)'
    }
  }, value), delta && React.createElement('span', {
    style: {
      font: 'var(--text-number-sm)',
      color: toneColor
    }
  }, delta));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/data-display/TransactionRow.jsx
try { (() => {
function TransactionRow({
  merchant,
  category,
  date,
  amount,
  kind = 'expense'
}) {
  const color = kind === 'income' ? 'var(--color-success)' : 'var(--color-ink)';
  const sign = kind === 'income' ? '+' : '-';
  return React.createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 4px',
      borderBottom: '1px solid var(--color-hairline-soft)',
      fontFamily: 'var(--font-sans)'
    }
  }, React.createElement('div', {
    style: {
      width: 36,
      height: 36,
      borderRadius: 'var(--radius-full)',
      background: 'var(--color-surface-strong)',
      flexShrink: 0
    }
  }), React.createElement('div', {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column'
    }
  }, React.createElement('span', {
    style: {
      font: 'var(--text-title-sm)',
      color: 'var(--color-ink)'
    }
  }, merchant), React.createElement('span', {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--color-muted)'
    }
  }, category + ' · ' + date)), React.createElement('span', {
    style: {
      font: 'var(--text-number-md)',
      color
    }
  }, sign + amount));
}
Object.assign(__ds_scope, { TransactionRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/TransactionRow.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Badge.jsx
try { (() => {
function Badge({
  children,
  tone = 'neutral'
}) {
  const tones = {
    neutral: {
      background: 'var(--color-surface-strong)',
      color: 'var(--color-ink)'
    },
    success: {
      background: '#e5f7ec',
      color: 'var(--color-success)'
    },
    danger: {
      background: '#fbe9ea',
      color: 'var(--color-danger)'
    },
    primary: {
      background: 'var(--color-primary-soft)',
      color: 'var(--color-primary)'
    }
  };
  return React.createElement('span', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 12px',
      borderRadius: 'var(--radius-pill)',
      font: 'var(--text-caption)',
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
      ...tones[tone]
    }
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Badge.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tag.jsx
try { (() => {
function Tag({
  children,
  onRemove
}) {
  return React.createElement('span', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px 4px 12px',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--color-surface-soft)',
      border: '1px solid var(--color-hairline)',
      font: 'var(--text-body-sm)',
      color: 'var(--color-body)'
    }
  }, children, onRemove && React.createElement('span', {
    onClick: onRemove,
    style: {
      cursor: 'pointer',
      color: 'var(--color-muted)'
    }
  }, '×'));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function Toast({
  message,
  tone = 'neutral',
  visible = true
}) {
  if (!visible) return null;
  const tones = {
    neutral: 'var(--color-surface-dark)',
    success: 'var(--color-success)',
    danger: 'var(--color-danger)'
  };
  return React.createElement('div', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '14px 20px',
      borderRadius: 'var(--radius-lg)',
      background: tones[tone],
      color: '#fff',
      font: 'var(--text-body-md)',
      boxShadow: 'var(--shadow-md)'
    }
  }, message);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
const {
  useState
} = React;
function Tooltip({
  label,
  children
}) {
  const [show, setShow] = useState(false);
  return React.createElement('span', {
    style: {
      position: 'relative',
      display: 'inline-block'
    },
    onMouseEnter: () => setShow(true),
    onMouseLeave: () => setShow(false)
  }, children, show && React.createElement('span', {
    style: {
      position: 'absolute',
      bottom: '125%',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--color-surface-dark)',
      color: '#fff',
      padding: '6px 10px',
      borderRadius: 'var(--radius-sm)',
      font: 'var(--text-caption)',
      whiteSpace: 'nowrap',
      zIndex: 10
    }
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon = null,
  children,
  onClick,
  type = 'button'
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    font: 'var(--text-button)',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 'var(--radius-pill)',
    transition: 'background .15s ease, transform .05s ease',
    height: size === 'lg' ? 52 : 44,
    padding: size === 'lg' ? '0 28px' : '0 20px'
  };
  const variants = {
    primary: {
      background: disabled ? 'var(--color-primary-disabled)' : 'var(--color-primary)',
      color: 'var(--color-on-primary)'
    },
    secondary: {
      background: 'var(--color-surface-strong)',
      color: 'var(--color-ink)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--color-primary)',
      padding: '0 4px',
      height: 'auto'
    }
  };
  const style = {
    ...base,
    ...variants[variant]
  };
  return React.createElement('button', {
    type,
    disabled,
    onClick,
    style,
    onMouseDown: e => {
      if (!disabled) e.currentTarget.style.transform = 'scale(0.97)';
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = 'scale(1)';
    },
    onMouseOver: e => {
      if (!disabled && variant === 'primary') e.currentTarget.style.background = 'var(--color-primary-hover)';
    },
    onMouseOut: e => {
      if (!disabled && variant === 'primary') e.currentTarget.style.background = 'var(--color-primary)';
    }
  }, icon, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function Checkbox({
  label,
  checked,
  onChange
}) {
  return React.createElement('label', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)'
    }
  }, React.createElement('span', {
    onClick: () => onChange && onChange(!checked),
    style: {
      width: 20,
      height: 20,
      borderRadius: 'var(--radius-xs)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: checked ? 'var(--color-primary)' : 'var(--color-canvas)',
      border: checked ? 'none' : '1px solid var(--color-muted-soft)',
      color: '#fff',
      fontSize: 13,
      transition: 'background .15s ease'
    }
  }, checked ? '✓' : ''), label && React.createElement('span', {
    style: {
      font: 'var(--text-body-md)',
      color: 'var(--color-ink)'
    }
  }, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
const {
  useState
} = React;
function Input({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error
}) {
  const [focused, setFocused] = useState(false);
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      fontFamily: 'var(--font-sans)'
    }
  }, label && React.createElement('label', {
    style: {
      font: 'var(--text-title-sm)',
      color: 'var(--color-ink)'
    }
  }, label), React.createElement('input', {
    type,
    placeholder,
    value,
    onChange,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      height: 48,
      padding: '0 16px',
      borderRadius: 'var(--radius-md)',
      font: 'var(--text-body-lg)',
      border: `1px solid ${error ? 'var(--color-danger)' : focused ? 'var(--color-primary)' : 'var(--color-hairline)'}`,
      borderWidth: focused ? 2 : 1,
      outline: 'none',
      color: 'var(--color-ink)',
      background: 'var(--color-canvas)'
    }
  }), error && React.createElement('span', {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--color-danger)'
    }
  }, error));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function Select({
  label,
  options = [],
  value,
  onChange
}) {
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      fontFamily: 'var(--font-sans)'
    }
  }, label && React.createElement('label', {
    style: {
      font: 'var(--text-title-sm)',
      color: 'var(--color-ink)'
    }
  }, label), React.createElement('select', {
    value,
    onChange,
    style: {
      height: 48,
      padding: '0 16px',
      borderRadius: 'var(--radius-md)',
      font: 'var(--text-body-lg)',
      border: '1px solid var(--color-hairline)',
      color: 'var(--color-ink)',
      background: 'var(--color-canvas)',
      appearance: 'auto'
    }
  }, options.map(o => React.createElement('option', {
    key: o.value ?? o,
    value: o.value ?? o
  }, o.label ?? o))));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  checked,
  onChange,
  label
}) {
  return React.createElement('label', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)'
    }
  }, React.createElement('span', {
    onClick: () => onChange && onChange(!checked),
    style: {
      width: 40,
      height: 24,
      borderRadius: 'var(--radius-pill)',
      background: checked ? 'var(--color-primary)' : 'var(--color-muted-soft)',
      position: 'relative',
      transition: 'background .15s ease',
      display: 'inline-block'
    }
  }, React.createElement('span', {
    style: {
      position: 'absolute',
      top: 2,
      left: checked ? 18 : 2,
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: '#fff',
      transition: 'left .15s ease',
      boxShadow: 'var(--shadow-sm)'
    }
  })), label && React.createElement('span', {
    style: {
      font: 'var(--text-body-md)',
      color: 'var(--color-ink)'
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Sidebar.jsx
try { (() => {
function Sidebar({
  items = [],
  active = 0,
  onSelect
}) {
  return React.createElement('div', {
    style: {
      width: 240,
      height: '100%',
      background: 'var(--color-canvas)',
      borderRight: '1px solid var(--color-hairline)',
      padding: 'var(--space-lg) var(--space-base)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xs)',
      fontFamily: 'var(--font-sans)',
      boxSizing: 'border-box'
    }
  }, React.createElement('div', {
    style: {
      font: '800 20px var(--font-sans)',
      color: 'var(--color-ink)',
      letterSpacing: '-0.02em',
      padding: '0 12px',
      marginBottom: 'var(--space-lg)'
    }
  }, 'finsight'), items.map((item, i) => React.createElement('div', {
    key: item.label,
    onClick: () => onSelect && onSelect(i),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 12px',
      borderRadius: 'var(--radius-md)',
      cursor: 'pointer',
      background: active === i ? 'var(--color-primary-soft)' : 'transparent',
      color: active === i ? 'var(--color-primary)' : 'var(--color-body)',
      font: active === i ? '600 14px var(--font-sans)' : 'var(--text-body-md)'
    }
  }, item.icon, item.label)));
}
Object.assign(__ds_scope, { Sidebar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Sidebar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
const {
  useState
} = React;
function Tabs({
  tabs = [],
  defaultIndex = 0,
  onChange
}) {
  const [active, setActive] = useState(defaultIndex);
  const select = i => {
    setActive(i);
    onChange && onChange(i);
  };
  return React.createElement('div', {
    style: {
      display: 'inline-flex',
      gap: 4,
      background: 'var(--color-surface-strong)',
      padding: 4,
      borderRadius: 'var(--radius-pill)',
      fontFamily: 'var(--font-sans)'
    }
  }, tabs.map((t, i) => React.createElement('button', {
    key: t,
    onClick: () => select(i),
    style: {
      border: 'none',
      cursor: 'pointer',
      padding: '8px 18px',
      borderRadius: 'var(--radius-pill)',
      font: 'var(--text-button)',
      background: active === i ? 'var(--color-canvas)' : 'transparent',
      color: active === i ? 'var(--color-ink)' : 'var(--color-muted)',
      boxShadow: active === i ? 'var(--shadow-sm)' : 'none',
      transition: 'all .15s ease'
    }
  }, t)));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/overlay/Dialog.jsx
try { (() => {
function Dialog({
  title,
  children,
  onClose,
  open = true
}) {
  if (!open) return null;
  return React.createElement('div', {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(20,23,31,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-sans)'
    }
  }, React.createElement('div', {
    style: {
      background: 'var(--color-canvas)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-md)',
      padding: 'var(--space-xl)',
      minWidth: 320,
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, React.createElement('div', {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, React.createElement('span', {
    style: {
      font: 'var(--text-title-lg)',
      color: 'var(--color-ink)'
    }
  }, title), React.createElement('span', {
    onClick: onClose,
    style: {
      cursor: 'pointer',
      color: 'var(--color-muted)',
      fontSize: 20
    }
  }, '×')), children));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlay/Dialog.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web-dashboard/Budgets.jsx
try { (() => {
function Budgets({
  ds
}) {
  const {
    Card,
    ProgressBar,
    Button
  } = ds;
  const cats = [['식비', 82, 100, 'warning'], ['교통', 40, 100, 'primary'], ['쇼핑', 108, 100, 'danger'], ['구독', 17, 100, 'primary'], ['여가', 60, 100, 'primary']];
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-lg)'
    }
  }, React.createElement('div', {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, React.createElement('div', {
    style: {
      font: 'var(--text-display-md)',
      color: 'var(--color-ink)'
    }
  }, '이번 달 예산'), React.createElement(Button, {
    variant: 'secondary'
  }, '예산 수정')), React.createElement(Card, {
    padded: true
  }, cats.map((c, i) => React.createElement('div', {
    key: i,
    style: {
      marginBottom: i === cats.length - 1 ? 0 : 20
    }
  }, React.createElement(ProgressBar, {
    label: c[0],
    value: c[1],
    max: c[2],
    tone: c[3]
  })))));
}
window.Budgets = Budgets;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web-dashboard/Budgets.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web-dashboard/Dashboard.jsx
try { (() => {
function Dashboard({
  ds
}) {
  const {
    Card,
    StatCard,
    TransactionRow,
    ProgressBar,
    Button,
    Badge
  } = ds;
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xl)'
    }
  }, React.createElement('div', {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, React.createElement('div', null, React.createElement('div', {
    style: {
      font: 'var(--text-display-md)',
      color: 'var(--color-ink)',
      letterSpacing: 'var(--tracking-display-md)'
    }
  }, '안녕하세요, 지은님 👋'), React.createElement('div', {
    style: {
      font: 'var(--text-body-md)',
      color: 'var(--color-muted)',
      marginTop: 4
    }
  }, '오늘도 가계부 정리해볼까요?')), React.createElement(Button, {
    variant: 'primary'
  }, '+ 거래 추가')), React.createElement('div', {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-lg)'
    }
  }, React.createElement('div', {
    style: {
      flex: '1 1 220px'
    }
  }, React.createElement(StatCard, {
    label: '이번 달 지출',
    value: '₩1,284,300',
    delta: '-12% 지난달 대비',
    tone: 'success'
  })), React.createElement('div', {
    style: {
      flex: '1 1 220px'
    }
  }, React.createElement(StatCard, {
    label: '이번 달 수입',
    value: '₩3,200,000',
    delta: '+2%',
    tone: 'success'
  })), React.createElement('div', {
    style: {
      flex: '1 1 220px'
    }
  }, React.createElement(StatCard, {
    label: '순 저축',
    value: '₩1,915,700',
    delta: '목표까지 84%',
    tone: 'neutral'
  }))), React.createElement('div', {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-lg)'
    }
  }, React.createElement('div', {
    style: {
      flex: '2 1 400px',
      minWidth: 0
    }
  }, React.createElement(Card, {
    padded: true
  }, [React.createElement('div', {
    key: 'h',
    style: {
      font: 'var(--text-title-md)',
      color: 'var(--color-ink)',
      marginBottom: 12,
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, [React.createElement('span', {
    key: 't'
  }, '최근 거래'), React.createElement(Badge, {
    key: 'b',
    tone: 'primary'
  }, '3건 신규')]), React.createElement(TransactionRow, {
    key: '1',
    merchant: '스타벅스',
    category: '카페',
    date: '7월 28일',
    amount: '6,500',
    kind: 'expense'
  }), React.createElement(TransactionRow, {
    key: '2',
    merchant: '월급',
    category: '수입',
    date: '7월 25일',
    amount: '3,200,000',
    kind: 'income'
  }), React.createElement(TransactionRow, {
    key: '3',
    merchant: '쿠팡',
    category: '쇼핑',
    date: '7월 24일',
    amount: '42,300',
    kind: 'expense'
  })])), React.createElement('div', {
    style: {
      flex: '1 1 260px',
      minWidth: 0
    }
  }, React.createElement(Card, {
    padded: true
  }, [React.createElement('div', {
    key: 'h',
    style: {
      font: 'var(--text-title-md)',
      color: 'var(--color-ink)',
      marginBottom: 16
    }
  }, '카테고리별 예산'), React.createElement('div', {
    key: 'b1',
    style: {
      marginBottom: 16
    }
  }, React.createElement(ProgressBar, {
    label: '식비',
    value: 82,
    max: 100,
    tone: 'warning'
  })), React.createElement('div', {
    key: 'b2',
    style: {
      marginBottom: 16
    }
  }, React.createElement(ProgressBar, {
    label: '교통',
    value: 40,
    max: 100,
    tone: 'primary'
  })), React.createElement('div', {
    key: 'b3'
  }, React.createElement(ProgressBar, {
    label: '쇼핑',
    value: 108,
    max: 100,
    tone: 'danger'
  }))]))));
}
window.Dashboard = Dashboard;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web-dashboard/Dashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web-dashboard/Login.jsx
try { (() => {
function Login({
  ds,
  onLogin
}) {
  const {
    Input,
    Button
  } = ds;
  return React.createElement('div', {
    style: {
      minHeight: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-surface-soft)'
    }
  }, React.createElement('div', {
    style: {
      background: 'var(--color-canvas)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-md)',
      padding: 'var(--space-xxl)',
      width: 360,
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, React.createElement('div', {
    style: {
      font: '800 24px var(--font-sans)',
      color: 'var(--color-ink)',
      letterSpacing: '-0.02em',
      textAlign: 'center'
    }
  }, 'finsight'), React.createElement('div', {
    style: {
      font: 'var(--text-body-md)',
      color: 'var(--color-muted)',
      textAlign: 'center'
    }
  }, '내 돈 흐름을 한눈에'), React.createElement(Input, {
    label: '이메일',
    placeholder: 'you@example.com'
  }), React.createElement(Input, {
    label: '비밀번호',
    type: 'password',
    placeholder: '••••••••'
  }), React.createElement(Button, {
    variant: 'primary',
    size: 'lg',
    onClick: onLogin
  }, '로그인'), React.createElement('div', {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--color-muted)',
      textAlign: 'center'
    }
  }, '계정이 없으신가요? 회원가입')));
}
window.Login = Login;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web-dashboard/Login.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web-dashboard/Transactions.jsx
try { (() => {
function Transactions({
  ds
}) {
  const {
    Card,
    TransactionRow,
    Select,
    Tag,
    Input
  } = ds;
  const rows = [['스타벅스', '카페', '7월 28일', '6,500', 'expense'], ['월급', '수입', '7월 25일', '3,200,000', 'income'], ['쿠팡', '쇼핑', '7월 24일', '42,300', 'expense'], ['지하철', '교통', '7월 24일', '1,500', 'expense'], ['넷플릭스', '구독', '7월 23일', '17,000', 'expense'], ['배달의민족', '식비', '7월 22일', '23,400', 'expense']];
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-lg)'
    }
  }, React.createElement('div', {
    style: {
      font: 'var(--text-display-md)',
      color: 'var(--color-ink)'
    }
  }, '거래 내역'), React.createElement('div', {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'flex-end'
    }
  }, React.createElement(Input, {
    placeholder: '거래 검색'
  }), React.createElement(Select, {
    label: '카테고리',
    options: [{
      value: 'all',
      label: '전체'
    }, {
      value: 'food',
      label: '식비'
    }, {
      value: 'transport',
      label: '교통'
    }]
  })), React.createElement('div', {
    style: {
      display: 'flex',
      gap: 8
    }
  }, ['전체', '식비', '교통', '쇼핑'].map(t => React.createElement(Tag, {
    key: t
  }, t))), React.createElement(Card, {
    padded: true
  }, rows.map((r, i) => React.createElement(TransactionRow, {
    key: i,
    merchant: r[0],
    category: r[1],
    date: r[2],
    amount: r[3],
    kind: r[4]
  }))));
}
window.Transactions = Transactions;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web-dashboard/Transactions.jsx", error: String((e && e.message) || e) }); }

__ds_ns.AmountDisplay = __ds_scope.AmountDisplay;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.TransactionRow = __ds_scope.TransactionRow;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Sidebar = __ds_scope.Sidebar;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Dialog = __ds_scope.Dialog;

})();
