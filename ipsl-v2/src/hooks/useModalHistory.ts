import { useEffect, useRef } from 'react';

export function useModalHistory(open: boolean, onClose: () => void) {
    const isBackRef = useRef(false);

    useEffect(() => {
        if (open) {
            // Push state when modal opens
            window.history.pushState({ modalOpen: true }, '', window.location.href);
            isBackRef.current = false;

            const handlePopState = () => {
                // Back button pressed
                isBackRef.current = true;
                onClose();
            };

            window.addEventListener('popstate', handlePopState);

            return () => {
                window.removeEventListener('popstate', handlePopState);
                // If closed programmatically (not by back button), remove the history state we pushed
                if (!isBackRef.current) {
                    window.history.back();
                }
            };
        }
    }, [open, onClose]);
}
