export const WrisorLogo = () => {
    return (
      <svg className="absolute w-full h-full inset-0" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Background gradient using dark primary/accent tones */}
          {/* <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor: "#AB7946", stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: "#9A6B3F", stopOpacity: 1}} />
          </linearGradient> */}

          <radialGradient id="bgGradient" cx="30%" cy="30%" r="100%">
          <stop offset="0%" style={{stopColor: "#ab7946", stopOpacity: 1}} />
          <stop offset="70%" style={{stopColor: "#3D2517", stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: "#ab7946", stopOpacity: 1}} />
        </radialGradient>
          
          {/* Central hub gradient (light cream for contrast) */}
          <radialGradient id="centralHubGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={{stopColor: "#F6EFDF", stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: "#EBE7DD", stopOpacity: 1}} />
          </radialGradient>
          
          {/* Outer nodes gradient (light tones) */}
          <radialGradient id="nodeGradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" style={{stopColor: "#F6EFDF", stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: "#D9C7A8", stopOpacity: 1}} />
          </radialGradient>
          
          {/* Connection line gradient (light golden) */}
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor: "#F6EFDF", stopOpacity: 0.9}} />
            <stop offset="50%" style={{stopColor: "#E0B36A", stopOpacity: 0.8}} />
            <stop offset="100%" style={{stopColor: "#F6EFDF", stopOpacity: 0.9}} />
          </linearGradient>
          
          {/* Shadow filter for depth */}
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#AB7946" floodOpacity="0.3"/>
          </filter>
          
          {/* Glow filter for connections */}
          <filter id="connectionGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Dark background container with primary brown */}
        <rect x="10" y="10" width="180" height="180" rx="32" ry="32" fill="url(#bgGradient)" stroke="#9A6B3F" strokeWidth="1"/>
        
        {/* Network centered at 100,100 */}
        <g transform="translate(100,100)">
          
          {/* Connection lines (drawn first to be behind nodes) */}
          <g stroke="url(#connectionGradient)" strokeWidth="2" fill="none" filter="url(#connectionGlow)">
            {/* Hub to all 4 nodes */}
            <line x1="0" y1="0" x2="0" y2="-45"/>
            <line x1="0" y1="0" x2="45" y2="0"/>
            <line x1="0" y1="0" x2="0" y2="45"/>
            <line x1="0" y1="0" x2="-45" y2="0"/>
            
            {/* Node to node connections (forming a square) */}
            <line x1="0" y1="-45" x2="45" y2="0"/>
            <line x1="45" y1="0" x2="0" y2="45"/>
            <line x1="0" y1="45" x2="-45" y2="0"/>
            <line x1="-45" y1="0" x2="0" y2="-45"/>
          </g>
          
          {/* 4 outer nodes (light cream) */}
          {/* Top node */}
          <circle cx="0" cy="-45" r="10" fill="url(#nodeGradient)" stroke="#E0B36A" strokeWidth="1" filter="url(#shadow)"/>
          
          {/* Right node */}
          <circle cx="45" cy="0" r="10" fill="url(#nodeGradient)" stroke="#E0B36A" strokeWidth="1" filter="url(#shadow)"/>
          
          {/* Bottom node */}
          <circle cx="0" cy="45" r="10" fill="url(#nodeGradient)" stroke="#E0B36A" strokeWidth="1" filter="url(#shadow)"/>
          
          {/* Left node */}
          <circle cx="-45" cy="0" r="10" fill="url(#nodeGradient)" stroke="#E0B36A" strokeWidth="1" filter="url(#shadow)"/>
          
          {/* Central hub (light cream - Wrisor's AI intelligence) */}
          <circle cx="0" cy="0" r="15" fill="url(#centralHubGradient)" stroke="#E0B36A" strokeWidth="1.5" filter="url(#shadow)"/>
          
          {/* Central icon - writing lines in dark brown */}
          <g stroke="#AB7946" strokeWidth="1.5" fill="none" opacity="0.8">
            <line x1="-6" y1="-4" x2="6" y2="-4"/>
            <line x1="-6" y1="0" x2="6" y2="0"/>
            <line x1="-6" y1="4" x2="6" y2="4"/>
          </g>
          
        </g>
        
        {/* Corner accent dots in light cream */}
        <circle cx="35" cy="35" r="3" fill="#F6EFDF" opacity="0.6"/>
        <circle cx="165" cy="35" r="3" fill="#F6EFDF" opacity="0.6"/>
        <circle cx="165" cy="165" r="3" fill="#F6EFDF" opacity="0.6"/>
        <circle cx="35" cy="165" r="3" fill="#F6EFDF" opacity="0.6"/>
        
      </svg>
    );
  };