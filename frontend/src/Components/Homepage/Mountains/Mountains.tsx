// src/Components/Homepage/Mountains/Mountains.tsx

import './Mountains.css';

function Mountains() {
    return(
        <div className="mountain-container">
            {/* Back layer mountains*/}
            <div className="mountain mountain-1"></div>
            <div className="mountain mountain-2"></div>
            <div className="mountain mountain-3"></div>
            <div className="mountain mountain-4"></div>
            <div className="mountain mountain-5"></div>
            <div className="mountain mountain-6"></div>
            
            {/* Middle layer mountains */}
            <div className="mountain mountain-7"></div>
            <div className="mountain mountain-8"></div>
            <div className="mountain mountain-9"></div>
            <div className="mountain mountain-10"></div>
            
            {/* Front layer mountains */}
            <div className="mountain mountain-11"></div>
            <div className="mountain mountain-12"></div>
            <div className="mountain mountain-13"></div>
            <div className="mountain mountain-14"></div>
            
            {/* Floating particles */}
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
        </div>
    );
}

export default Mountains;