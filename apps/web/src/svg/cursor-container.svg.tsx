export const CursorContainer = () => {
    return (
        <div className="absolute inset-0 h-full w-full">
            <svg 
                width="100%" 
                height="100%" 
                viewBox="0 0 1000 1000" 
                className="overflow-visible"
                preserveAspectRatio="none" 
            >
                {/* STEP 1: The Fill. A simple rectangle with a fill but NO stroke. */}
                <rect 
                    x="0" 
                    y="0" 
                    width="1000" 
                    height="1000" 
                    fill="#E0B36A" 
                    fillOpacity="0.1" 
                />

                {/* STEP 2: The Strokes. Our original two lines, drawn on top of the rect. */}
                <path 
                    d="M 0 0 L 0 1000" 
                    fill="none" 
                    stroke="#E0B36A" 
                    strokeWidth="4" 
                    vectorEffect="non-scaling-stroke" 
                />
                <path 
                    d="M 1000 0 L 1000 1000" 
                    fill="none" 
                    stroke="#E0B36A" 
                    strokeWidth="4" 
                    vectorEffect="non-scaling-stroke" 
                />
            </svg>
        </div>
    )
}