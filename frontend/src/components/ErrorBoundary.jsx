import { Component } from 'react';
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '400px' }}>
                        <div style={{ fontSize: '40px', marginBottom: '1rem' }}>⚠️</div>
                        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Syne,sans-serif', marginBottom: '8px' }}>
                            Something went wrong
                        </h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            An unexpected error occurred. Please refresh the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
export default ErrorBoundary;