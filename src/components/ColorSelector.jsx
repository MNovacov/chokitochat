import React from 'react';

export default function ColorSelector({ onChange, currentPalette }) {
  const handleColorChange = (colorType, colorValue) => {
    onChange(colorType, colorValue);
  };

  const colors = [
    { name: 'primary', color: '#222' },
    { name: 'secondary', color: '#78b784' },
    { name: 'tertiary', color: '#94a0c7' },
    { name: 'quaternary', color: '#4f9cdb' },
  ];

  return (
    <div className="color-selector">
      {colors.map((colorOption, index) => (
        <div key={index} className="color-option">
          <button
            onClick={() => handleColorChange('secondary', colorOption.color)}
            style={{
              backgroundColor: colorOption.color,
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              border: 'none',
              cursor: 'pointer',
              margin: '5px',
            }}
          />
        </div>
      ))}
    </div>
  );
}
