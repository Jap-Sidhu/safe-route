// src/Components/CursorGlow/CursorGlow.tsx

import React, { useState, useEffect } from 'react';
import './CursorGlow.css';

const CursorGlow: React.FC = () => {
    
    const [position, setPosition] = useState({ x: -100, y: -100 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setPosition({
                x: e.clientX - 30,
                y: e.clientY - 30,
            });
        };

        window.addEventListener('mousemove', handleMouseMove);

        // clean up function
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return(
        <div 
            className="cursor-glow"
            style={{ left:`${position.x}px`, top: `${position.y}px` }}
        ></div>
    );
}

export default CursorGlow;