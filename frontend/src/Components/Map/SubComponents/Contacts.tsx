import { useEffect, useRef } from 'react'; 
import './Contacts.css';

interface ContactsProps {
    isOpen: boolean;
    onClose: () => void;
}

function Contacts({ isOpen, onClose }: ContactsProps) {
    const modalOverlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (modalOverlayRef.current && e.target === modalOverlayRef.current) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, onClose]);

    const handleCall = (phoneNumber: string) => {
        const telLink = `tel:${phoneNumber.replace(/[^0-9+]/g, '')}`;
        window.open(telLink);
    };

    if (!isOpen) {
        return null;
    }

    return (
        // Apply the 'active' class conditionally 
        <div className={`modal-overlay ${isOpen ? 'active' : ''}`} ref={modalOverlayRef}>
            <div className="modal">
                <div className="modal-header">
                    <h2 className="modal-title">🚨 Emergency Contacts</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-content">
                    {/* modal content for emergency contacts */}
                    <div className="emergency-section critical">
                        <div className="emergency-header">
                            <span className="emergency-icon">🚨</span>
                            <div className="emergency-info">
                                <h3>Immediate Emergency</h3>
                                <p>Life-threatening situations requiring immediate response</p>
                            </div>
                        </div>
                        <div className="emergency-contacts">
                            <div className="emergency-contact">
                                <div className="contact-info">
                                    <span className="contact-name">Emergency Services</span>
                                    <span className="contact-number">911</span>
                                </div>
                                <button className="call-btn" onClick={() => handleCall('911')}>Call</button>
                            </div>
                        </div>
                    </div>

                    <div className="emergency-section">
                        <div className="emergency-header">
                            <span className="emergency-icon">🚒</span>
                            <div className="emergency-info">
                                <h3>Fire & Rescue</h3>
                                <p>Fire emergencies, wildfire evacuations, rescue operations</p>
                            </div>
                        </div>
                        <div className="emergency-contacts">
                            <div className="emergency-contact">
                                <div className="contact-info">
                                    <span className="contact-name">Fire Department</span>
                                    <span className="contact-number">911</span>
                                </div>
                                <button className="call-btn" onClick={() => handleCall('911')}>Call</button>
                            </div>
                            <div className="emergency-contact">
                                <div className="contact-info">
                                    <span className="contact-name">Fire Info Hotline</span>
                                    <span className="contact-number">1-800-FIRE-411</span>
                                </div>
                                <button className="call-btn" onClick={() => handleCall('18003473411')}>Call</button>
                            </div>
                        </div>
                    </div>

                    <div className="emergency-section">
                        <div className="emergency-header">
                            <span className="emergency-icon">🚑</span>
                            <div className="emergency-info">
                                <h3>Medical Emergency</h3>
                                <p>Medical emergencies, poison control, health services</p>
                            </div>
                        </div>
                        <div className="emergency-contacts">
                            <div className="emergency-contact">
                                <div className="contact-info">
                                    <span className="contact-name">Medical Emergency</span>
                                    <span className="contact-number">911</span>
                                </div>
                                <button className="call-btn" onClick={() => handleCall('911')}>Call</button>
                            </div>
                            <div className="emergency-contact">
                                <div className="contact-info">
                                    <span className="contact-name">Poison Control</span>
                                    <span className="contact-number">1-800-222-1222</span>
                                </div>
                                <button className="call-btn" onClick={() => handleCall('18002221222')}>Call</button>
                            </div>
                        </div>
                    </div>

                    <div className="emergency-section">
                        <div className="emergency-header">
                            <span className="emergency-icon">🌍</span>
                            <div className="emergency-info">
                                <h3>Disaster Information</h3>
                                <p>Earthquake updates, disaster preparedness, community resources</p>
                            </div>
                        </div>
                        <div className="emergency-contacts">
                            <div className="emergency-contact">
                                <div className="contact-info">
                                    <span className="contact-name">Emergency Info Line</span>
                                    <span className="contact-number">211</span>
                                </div>
                                <button className="call-btn" onClick={() => handleCall('211')}>Call</button>
                            </div>
                            <div className="emergency-contact">
                                <div className="contact-info">
                                    <span className="contact-name">Red Cross Emergency</span>
                                    <span className="contact-number">1-800-RED-CROSS</span>
                                </div>
                                <button className="call-btn" onClick={() => handleCall('18007332767')}>Call</button>
                            </div>
                        </div>
                    </div>

                    <div className="emergency-note">
                        <p><strong>⚠️ Important:</strong> In life-threatening emergencies, always call 911 first. These numbers are for information and non-critical assistance.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Contacts;