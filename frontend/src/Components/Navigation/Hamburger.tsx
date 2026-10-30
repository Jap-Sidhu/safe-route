// src/Components/Navigation/Hamburger.tsx

import "./Hamburger.css"

interface BurgerProps {
    isSidebarActive: boolean;
    onToggleSidebar: () => void;
}

const Hamburger = (props: BurgerProps) => {
    const { isSidebarActive, onToggleSidebar } = props;
    return(
       <header className="header">
          <button
            className={`menu-toggle ${isSidebarActive ? "active" : ''}`}
            onClick={onToggleSidebar}
          >
            <div className="hamburger">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </header> 
    );
};

export default Hamburger;