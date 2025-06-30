// We need to pass down the className prop for styling from the parent
export const PaperTexture = ({ className }) => {
    return (
      // The SVG element itself will be styled to fill the screen
      <svg xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* <defs> is where we define things we want to use later, like filters and patterns. */}
        <defs>
          {/* Our original filter recipe is unchanged, but now has a unique ID */}
          <filter id="paper-texture-filter" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="pulp" />
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="speckles_raw" />
              <feColorMatrix in="speckles_raw" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 50 -25" result="speckles" />
              <feComposite in="pulp" in2="speckles" operator="in" />
          </filter>
  
          {/* * THE AHA! MOMENT: The <pattern> element.
            * This defines a small, tileable unit (200x200).
            * Inside it, we create a rectangle that is filled with our filter effect.
          */}
          <pattern id="paper-pattern" patternUnits="userSpaceOnUse" width="200" height="200">
             <rect width="100%" height="100%" filter="url(#paper-texture-filter)" opacity="0.4" />
          </pattern>
        </defs>
        
        {/* * This is the final visible rectangle. 
          * It fills 100% of the SVG's area, and its `fill` is our repeating pattern.
          * The SVG engine handles the tiling for us automatically.
        */}
        <rect width="100%" height="100%" fill="url(#paper-pattern)" />
      </svg>
    );
  };