import { useCallback, useEffect, useState } from "react";

/**
 * A custom hook for wouter that uses window.location.hash
 * instead of the full path. This is required for Electron
 * when loading the app via file:// protocol.
 */
const getHashPath = () => {
    const hash = window.location.hash;
    if (!hash) return "/";
    // Remove the # and ensure it starts with /
    const path = hash.replace(/^#/, "");
    return path.startsWith("/") ? path : "/" + path;
};

export const useHashLocation = () => {
    const [loc, setLoc] = useState(getHashPath());

    useEffect(() => {
        const handler = () => {
            setLoc(getHashPath());
        };

        window.addEventListener("hashchange", handler);
        return () => window.removeEventListener("hashchange", handler);
    }, []);

    const navigate = useCallback((to: string, { replace = false } = {}) => {
        if (replace) {
            window.location.replace("#" + to);
        } else {
            window.location.hash = "#" + to;
        }
    }, []);

    return [loc, navigate] as [string, (to: string, options?: { replace?: boolean }) => void];
};
