'use client';

import { useEffect, useRef, useState } from 'react';

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export default function Turnstile({
  siteKey,
  onVerify,
  onError,
  onExpire,
  theme = 'auto',
  size = 'normal',
  className = '',
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Store callbacks in refs to prevent unnecessary re-renders
  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);
  const siteKeyRef = useRef(siteKey);
  const themeRef = useRef(theme);
  const sizeRef = useRef(size);

  // Update refs when props change (without triggering re-render)
  useEffect(() => {
    onVerifyRef.current = onVerify;
    onErrorRef.current = onError;
    onExpireRef.current = onExpire;
    siteKeyRef.current = siteKey;
    themeRef.current = theme;
    sizeRef.current = size;
  }, [onVerify, onError, onExpire, siteKey, theme, size]);

  useEffect(() => {
    // Load Turnstile script only once
    if (document.querySelector('script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]')) {
      // Script already loaded
      if (window.turnstile) {
        setIsLoaded(true);
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.body.appendChild(script);

    return () => {
      // Don't remove script on unmount - it might be used by other instances
      // Only remove widget
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.turnstile || widgetIdRef.current) return;

    // Render Turnstile widget only once
    const widgetId = window.turnstile.render(containerRef.current, {
      sitekey: siteKeyRef.current,
      callback: (token: string) => {
        onVerifyRef.current(token);
      },
      'error-callback': () => {
        onErrorRef.current?.();
      },
      'expired-callback': () => {
        onExpireRef.current?.();
        widgetIdRef.current = null;
      },
      theme: themeRef.current,
      size: sizeRef.current,
    });

    widgetIdRef.current = widgetId;

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [isLoaded]);

  const reset = () => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  };

  // Expose reset method via ref (optional, for parent components)
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).reset = reset;
    }
  }, []);

  // Reset widget if siteKey changes (but don't recreate the entire widget)
  useEffect(() => {
    if (widgetIdRef.current && window.turnstile && siteKeyRef.current !== siteKey) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [siteKey]);

  return <div ref={containerRef} className={className} />;
}

