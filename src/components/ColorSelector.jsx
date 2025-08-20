import React from 'react';

export default function ColorSelector({ onChange, currentPalette }) {
  const hexToRgba = (hex, alpha = 0.31) => {
    hex = hex.replace('#', '');
  
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
  
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
  
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const handleColorChange = (colorType, colorValue) => {
    const rgbaColor = hexToRgba(colorValue, 0.35); 
    onChange(colorType, rgbaColor);
  };

  const colors = [
    { name: 'primary', color: '#000000' },
    { name: 'secondary', color: '#00F2FB' },
    { name: 'tertiary', color: '#00b71d' },
    { name: 'quaternary', color: '#1e1e62' },
  ];

  return (
    <div className="color-selector">
      {colors.map((colorOption, index) => (
        <div key={index} className="color-option">
          <button
            onClick={() => handleColorChange('secondary', colorOption.color)}
            className={`color-circle ${
              currentPalette.secondary === colorOption.color ? 'selected' : ''
            }`}
            style={{ backgroundColor: colorOption.color }}
          />
        </div>
      ))}
    </div>
  );
}
