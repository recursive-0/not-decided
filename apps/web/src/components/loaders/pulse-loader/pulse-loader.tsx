import './pulse-loader.css';

/**
 * A configurable pulse loader component.
 * @param {string} color - The main color of the central dot.
 * @param {string} shadowColor - The color of the pulsing shadow. Defaults to a transparent version of the main color.
 * @param {number} size - The width and height of the loader in pixels.
 * @param {number} spread - The final distance the pulse animation should spread to in pixels.
 */
const PulseLoader = ({
  color = '#000',
  shadowColor, // We'll calculate a default if not provided
  size = 16,
  spread = 40,
}) => {
  // If no shadowColor is given, we intelligently create a transparent
  // version of the main color. This is a great DX improvement.
  const defaultShadowColor = 'rgba(0,0,0,0.25)'; // Fallback if color isn't hex
  let finalShadowColor = shadowColor || defaultShadowColor;

  if (!shadowColor && color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    finalShadowColor = `rgba(${r},${g},${b},0.25)`;
  }
  
  const style = {
    // Set the values for the CSS variables
    '--pulse-color': color,
    '--pulse-shadow-color': finalShadowColor,
    '--pulse-spread': `${spread}px`,

    // We can also set width/height directly here
    width: `${size}px`,
    height: `${size}px`,
  };

  return <div className="pulse-loader" style={style} />;
};

export default PulseLoader;