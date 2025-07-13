// export const WrisorLogo = () => {
//     return (
//       <svg className="absolute w-full h-full inset-0" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
//         <defs>
//           {/* Background gradient using dark primary/accent tones */}
//           {/* <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
//             <stop offset="0%" style={{stopColor: "#AB7946", stopOpacity: 1}} />
//             <stop offset="100%" style={{stopColor: "#9A6B3F", stopOpacity: 1}} />
//           </linearGradient> */}

//           <radialGradient id="bgGradient" cx="30%" cy="30%" r="100%">
//           <stop offset="0%" style={{stopColor: "#ab7946", stopOpacity: 1}} />
//           <stop offset="70%" style={{stopColor: "#3D2517", stopOpacity: 1}} />
//           <stop offset="100%" style={{stopColor: "#ab7946", stopOpacity: 1}} />
//         </radialGradient>

//           {/* Central hub gradient (light cream for contrast) */}
//           <radialGradient id="centralHubGradient" cx="50%" cy="50%" r="50%">
//             <stop offset="0%" style={{stopColor: "#F6EFDF", stopOpacity: 1}} />
//             <stop offset="100%" style={{stopColor: "#EBE7DD", stopOpacity: 1}} />
//           </radialGradient>

//           {/* Outer nodes gradient (light tones) */}
//           <radialGradient id="nodeGradient" cx="30%" cy="30%" r="70%">
//             <stop offset="0%" style={{stopColor: "#F6EFDF", stopOpacity: 1}} />
//             <stop offset="100%" style={{stopColor: "#D9C7A8", stopOpacity: 1}} />
//           </radialGradient>

//           {/* Connection line gradient (light golden) */}
//           <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
//             <stop offset="0%" style={{stopColor: "#F6EFDF", stopOpacity: 0.9}} />
//             <stop offset="50%" style={{stopColor: "#E0B36A", stopOpacity: 0.8}} />
//             <stop offset="100%" style={{stopColor: "#F6EFDF", stopOpacity: 0.9}} />
//           </linearGradient>

//           {/* Shadow filter for depth */}
//           <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
//             <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#AB7946" floodOpacity="0.3"/>
//           </filter>

//           {/* Glow filter for connections */}
//           <filter id="connectionGlow" x="-50%" y="-50%" width="200%" height="200%">
//             <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
//             <feMerge>
//               <feMergeNode in="coloredBlur"/>
//               <feMergeNode in="SourceGraphic"/>
//             </feMerge>
//           </filter>
//         </defs>

//         {/* Dark background container with primary brown */}
//         <rect x="10" y="10" width="180" height="180" rx="32" ry="32" fill="url(#bgGradient)" stroke="#9A6B3F" strokeWidth="1"/>

//         {/* Network centered at 100,100 */}
//         <g transform="translate(100,100)">

//           {/* Connection lines (drawn first to be behind nodes) */}
//           <g stroke="url(#connectionGradient)" strokeWidth="2" fill="none" filter="url(#connectionGlow)">
//             {/* Hub to all 4 nodes */}
//             <line x1="0" y1="0" x2="0" y2="-45"/>
//             <line x1="0" y1="0" x2="45" y2="0"/>
//             <line x1="0" y1="0" x2="0" y2="45"/>
//             <line x1="0" y1="0" x2="-45" y2="0"/>

//             {/* Node to node connections (forming a square) */}
//             <line x1="0" y1="-45" x2="45" y2="0"/>
//             <line x1="45" y1="0" x2="0" y2="45"/>
//             <line x1="0" y1="45" x2="-45" y2="0"/>
//             <line x1="-45" y1="0" x2="0" y2="-45"/>
//           </g>

//           {/* 4 outer nodes (light cream) */}
//           {/* Top node */}
//           <circle cx="0" cy="-45" r="10" fill="url(#nodeGradient)" stroke="#E0B36A" strokeWidth="1" filter="url(#shadow)"/>

//           {/* Right node */}
//           <circle cx="45" cy="0" r="10" fill="url(#nodeGradient)" stroke="#E0B36A" strokeWidth="1" filter="url(#shadow)"/>

//           {/* Bottom node */}
//           <circle cx="0" cy="45" r="10" fill="url(#nodeGradient)" stroke="#E0B36A" strokeWidth="1" filter="url(#shadow)"/>

//           {/* Left node */}
//           <circle cx="-45" cy="0" r="10" fill="url(#nodeGradient)" stroke="#E0B36A" strokeWidth="1" filter="url(#shadow)"/>

//           {/* Central hub (light cream - Wrisor's AI intelligence) */}
//           <circle cx="0" cy="0" r="15" fill="url(#centralHubGradient)" stroke="#E0B36A" strokeWidth="1.5" filter="url(#shadow)"/>

//           {/* Central icon - writing lines in dark brown */}
//           <g stroke="#AB7946" strokeWidth="1.5" fill="none" opacity="0.8">
//             <line x1="-6" y1="-4" x2="6" y2="-4"/>
//             <line x1="-6" y1="0" x2="6" y2="0"/>
//             <line x1="-6" y1="4" x2="6" y2="4"/>
//           </g>

//         </g>

//         {/* Corner accent dots in light cream */}
//         <circle cx="35" cy="35" r="3" fill="#F6EFDF" opacity="0.6"/>
//         <circle cx="165" cy="35" r="3" fill="#F6EFDF" opacity="0.6"/>
//         <circle cx="165" cy="165" r="3" fill="#F6EFDF" opacity="0.6"/>
//         <circle cx="35" cy="165" r="3" fill="#F6EFDF" opacity="0.6"/>

//       </svg>
//     );
//   };

export const WrisorLogo = () => {
  return (
    <svg
      className="absolute w-full h-full inset-0"
      viewBox="0 0 1000 1000"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* The filter recipe is perfect. No changes needed here. */}
        <filter id="glow-effect">
          <feGaussianBlur stdDeviation="15" result="blurred" />
        </filter>
      </defs>

      {/* The background rectangle */}
      <rect
        x="200"
        y="200"
        width="600"
        height="600"
        rx="120"
        fill="#261406"
        stroke="#aa8362"
        strokeWidth="4"
      />

      {/* STEP 1: THE GLOW LAYER
        We group the entire circle object and apply the filter to the group.
        This creates a blurry version of the whole circle.
      */}
      <g filter="url(#glow-effect)">
        <path
          d="M 500 300 A 200 200 0 0 1 500 700"
          fill="white"
        />
        <path
          d="M 500 300 A 200 200 0 0 0 500 700"
          fill="white"
        />
        {/* The glow from the line itself is subtle but adds to the effect */}
        <line
          x1="500"
          y1="300"
          x2="500"
          y2="700"
          stroke="#aa8362"
          strokeWidth="4"
        />
      </g>

      {/* STEP 2: THE OBJECT LAYER
        We draw the exact same group again, but with NO filter.
        This sharp object sits directly on top of its own blurry halo.
      */}
      <g>
        <path
          d="M 500 300 A 200 200 0 0 1 500 700"
          fill="#4d321f"
        />
        <path
          d="M 500 300 A 200 200 0 0 0 500 700"
          fill="#aa8362"
        />
        <line
          x1="500"
          y1="300"
          x2="500"
          y2="700"
          stroke="#aa8362"
          strokeWidth="4"
        />
      </g>
    </svg>
  );
};
