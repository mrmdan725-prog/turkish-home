import React from 'react';

const Logo = ({ size = 40, showText = true, color = '#4B2C20' }) => {
    return (
        <div className="company-logo-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* House Outline */}
                <path
                    d="M50 15L85 45V85H15V45L50 15Z"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Door/Arch */}
                <path
                    d="M42 85V65C42 60.5817 45.5817 57 50 57C54.4183 57 58 60.5817 58 65V85"
                    stroke={color}
                    strokeWidth="2.5"
                />

                {/* Left Plant */}
                <path d="M25 75H35V82H25V75Z" fill={color} />
                <path d="M30 75V60" stroke={color} strokeWidth="1.5" />
                <circle cx="30" cy="58" r="2" fill={color} />
                <path d="M27 65C27 65 24 63 24 60" stroke={color} strokeWidth="1" />
                <path d="M33 68C33 68 36 66 36 63" stroke={color} strokeWidth="1" />

                {/* Right Plant */}
                <path d="M65 75H75V82H65V75Z" fill={color} />
                <path d="M70 75V60" stroke={color} strokeWidth="1.5" />
                <circle cx="70" cy="58" r="2" fill={color} />
                <path d="M67 65C67 65 64 63 64 60" stroke={color} strokeWidth="1" />
                <path d="M73 68C73 68 76 66 76 63" stroke={color} strokeWidth="1" />

                {/* Botanical Details (Wheat-like leaves) */}
                <path d="M50 35V50" stroke={color} strokeWidth="1.5" />
                <path d="M47 40Q40 38 42 35" stroke={color} strokeWidth="1" />
                <path d="M53 42Q60 40 58 37" stroke={color} strokeWidth="1" />
            </svg>

            {showText && (
                <div className="logo-text-group" style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                    <span style={{
                        fontSize: '1.2rem',
                        fontWeight: '800',
                        color: color,
                        lineHeight: '1',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}>البيت التركي</span>
                    <span style={{
                        fontSize: '0.65rem',
                        color: color,
                        opacity: '0.8',
                        marginTop: '2px'
                    }}>للأدوات المنزلية والأنتيكات</span>
                </div>
            )}
        </div>
    );
};

export default Logo;
