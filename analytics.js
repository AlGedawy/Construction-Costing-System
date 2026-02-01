(function(){
    // Analytics & basic error hooks (Phase 6)
    // GDPR note: Do not send PII. This client-side code logs locally and prepares hooks

    function isPlausibleLoaded() {
        // Plausible creates a `plausible` function in window
        return typeof window.plausible === 'function';
    }

    function isClarityLoaded() {
        // Clarity creates a `clarity` function in window (after script loads)
        return typeof window.clarity === 'function' || typeof window.clarity === 'object';
    }

    function getRuntimeInfo() {
        return {
            appVersion: (window.AppConfig && window.AppConfig.APP_VERSION) || 'unknown',
            environment: (window.AppConfig && window.AppConfig.ENV) || 'unknown',
            userAgent: navigator.userAgent || 'unknown'
        };
    }

    // Error reporting - currently console-based; TODO: integrate Sentry or similar
    function reportError(payload) {
        // payload: { message, stack, source, lineno, colno, extra }
        try {
            console.error('[AppReport] Error:', payload);
            // Example: if you use Sentry, call Sentry.captureException here.
            // TODO: integrate with Sentry/LogRocket/YourService: send minimal non-PII payload.
            if (isPlausibleLoaded()) {
                // Track an 'Error' event (no PII) in Plausible (optional)
                try {
                    window.plausible('Error', { props: { message: String(payload.message).slice(0, 200) } });
                } catch (e) { /* ignore */ }
            }
        } catch (e) { /* ignore */ }
    }

    // Global handler for uncaught errors
    window.onerror = function(message, source, lineno, colno, error) {
        const payload = { message, source, lineno, colno, stack: (error && error.stack) || null };
        reportError(payload);
        // return false to allow default handling as well
        return false;
    };

    // Handle resource errors
    window.addEventListener('error', function(ev) {
        try {
            if (ev && ev.error) {
                reportError({ message: ev.message || 'Unhandled error event', stack: ev.error.stack });
            } else if (ev && ev.target && (ev.target.src || ev.target.href)) {
                // Resource load failure (script/style/image)
                reportError({ message: 'Resource load error', source: ev.target.src || ev.target.href });
            }
        } catch(e) {}
    }, { capture: true });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', function(e) {
        reportError({ message: 'Unhandled Promise Rejection', stack: e && e.reason && e.reason.stack ? e.reason.stack : String(e.reason) });
    });

    // Expose a simple API for Diagnostics UI
    window.Analytics = {
        isPlausibleLoaded, isClarityLoaded, getRuntimeInfo, reportError
    };
})();