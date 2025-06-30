export const Grid = () => {
    return (
        <div className="absolute inset-0 h-full w-full opacity-30">
            <svg width="100%" height="100%" viewBox="0 0 400 300" className="overflow-visible">
                {/* Horizontal processing lines with nodes */}
                <path id="path1" d="M 20 50 H 60 Q 65 50 65 55 V 65 Q 65 70 70 70 H 120 L 140 85 H 180" 
                      fill="none" stroke="#E0B36A" strokeWidth="0.3" />

                      
                
                <path id="path2" d="M 50 120 H 90 Q 95 120 95 115 V 105 Q 95 100 100 100 H 150 L 170 115 H 220 Q 225 115 225 120 V 130" 
                      fill="none" stroke="#E0B36A" strokeWidth="0.6" />
                
                <path id="path3" d="M 10 180 H 45 Q 50 180 50 175 V 165 Q 50 160 55 160 H 100 L 120 145 H 160 Q 165 145 165 150 V 160 H 200" 
                      fill="none" stroke="#E0B36A" strokeWidth="0.6" />



                {/* Vertical connecting lines */}
                <path id="path4" d="M 65 70 V 100 Q 65 105 70 105 H 85 Q 90 105 90 110 V 120" 
                      fill="none" stroke="#E0B36A" strokeWidth="0.6" />
                
                <path id="path5" d="M 140 85 V 110 Q 140 115 145 115 H 155 Q 160 115 160 120 V 145" 
                      fill="none" stroke="#E0B36A" strokeWidth="0.6" />

                <path id="path6" d="M 200 130 V 155 Q 200 160 195 160 H 175 Q 170 160 170 165 V 180" 
                      fill="none" stroke="#E0B36A" strokeWidth="0.6" />

                {/* Curved processing pipes */}
                <path id="path7" d="M 250 40 Q 280 45 290 70 Q 295 85 310 90 H 350 Q 360 90 365 95 V 110"   
                      fill="none" stroke="#E0B36A" strokeWidth="0.6" />

                {/* Processing nodes/boxes */}
                <rect x="60" y="65" width="10" height="10" fill="none" stroke="#E0B36A" strokeWidth="0.6" />
                <rect x="115" y="80" width="10" height="10" fill="none" stroke="#E0B36A" strokeWidth="0.6" />
                <rect x="85" y="115" width="10" height="10" fill="none" stroke="#E0B36A" strokeWidth="0.6" />
                <rect x="145" y="110" width="10" height="10" fill="none" stroke="#E0B36A" strokeWidth="0.6" />
                <rect x="155" y="140" width="10" height="10" fill="none" stroke="#E0B36A" strokeWidth="0.6" />
                <rect x="220" y="115" width="8" height="8" fill="none" stroke="#E0B36A" strokeWidth="0.6" />
                <rect x="285" y="65" width="8" height="8" fill="none" stroke="#E0B36A" strokeWidth="0.6" />
                <rect x="360" y="105" width="8" height="8" fill="none" stroke="#E0B36A" strokeWidth="0.6" />

                {/* Small connection dots */}
                <circle cx="70" cy="70" r="1.5" fill="#E0B36A" />
                <circle cx="140" cy="85" r="1.5" fill="#E0B36A" />
                <circle cx="95" cy="115" r="1.5" fill="#E0B36A" />
                <circle cx="165" cy="145" r="1.5" fill="#E0B36A" />
                <circle cx="310" cy="90" r="1.5" fill="#E0B36A" />
                <circle cx="350" cy="170" r="1.5" fill="#E0B36A" />

                {/* Additional random scattered lines */}
                <path id="path8" d="M 300 25 H 330 Q 335 25 335 30 V 40 L 350 50" 
                      fill="none" stroke="#E0B36A" strokeWidth="0.6" opacity="0.7" />
                
                <path id="path9" d="M 30 200 H 70 Q 75 200 75 195 V 185 H 110" 
                      fill="none" stroke="#E0B36A" strokeWidth="0.6" opacity="0.7" />

                <path id="path10" d="M 240 200 H 280 L 295 215 H 330 Q 335 215 335 220 V 235" 
                      fill="none" stroke="#E0B36A" strokeWidth="0.6" opacity="0.7" />

                {/* More processing boxes */}
                <rect x="70" y="195" width="6" height="6" fill="none" stroke="#E0B36A" strokeWidth="0.5" opacity="0.8" />
                <rect x="290" y="210" width="6" height="6" fill="none" stroke="#E0B36A" strokeWidth="0.5" opacity="0.8" />
                <rect x="345" y="45" width="6" height="6" fill="none" stroke="#E0B36A" strokeWidth="0.5" opacity="0.8" />
                
                {/* Diagonal connecting lines */}
                <path id="path11" d="M 120 175 L 140 195 H 160 Q 165 195 165 200 V 210" 
                      fill="none" stroke="#E0B36A" strokeWidth="0.6" opacity="0.6" />
                
                <path id="path12" d="M 270 80 L 285 95 H 305 Q 310 95 310 100 V 120" 
                      fill="none" stroke="#E0B36A" strokeWidth="0.6" opacity="0.6" />
            </svg>
        </div>
    )
}