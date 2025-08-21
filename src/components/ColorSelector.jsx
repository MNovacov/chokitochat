import React from 'react';

export default function ColorSelector({ onChange, currentTheme }) {
  const hexToRgba = (hex, alpha = 0.35) => {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const THEMES = [
    { className: 'theme-dark',   hex: '#000000', label: 'Negro'   }, 
    { className: 'theme-cyan',   hex: '#00F2FB', label: 'Celeste' }, 
    { className: 'theme-green',  hex: '#00b71d', label: 'Verde'   }, 
    { className: 'theme-indigo', hex: '#1e1e62', label: 'Azul'    }, 
  ];

  const pick = (opt) => {
    onChange('secondary', hexToRgba(opt.hex, 0.35));  
    onChange('theme', opt.className);                 
  };

  return (
    <div className="color-selector">
      {THEMES.map((opt, i) => (
        <button
          key={i}
          onClick={() => pick(opt)}
          className={`color-circle ${currentTheme === opt.className ? 'selected' : ''}`}
          style={{ backgroundColor: opt.hex }}
          aria-label={opt.label}
          title={opt.label}
        />
      ))}
    </div>
  );
}
