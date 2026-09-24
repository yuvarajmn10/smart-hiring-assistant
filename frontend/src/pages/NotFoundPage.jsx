import { useNavigate } from 'react-router-dom';
const NotFoundPage = () => {
    const navigate = useNavigate();
    return (
        <div style={{
            minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.08) 0%, transparent 65%)',
        }}>
            <div className="fade-up" style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="font-display" style={{ fontSize: '96px', fontWeight: 800, color: 'rgba(99,102,241,0.2)', lineHeight: 1, marginBottom: '1rem', letterSpacing: '-4px' }}>
                    404
                </div>
                <h1 className="font-display" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Page not found
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '320px', margin: '0 auto 2rem' }}>
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button onClick={() => navigate(-1)} style={{
                        background: 'var(--tint-04)', color: 'var(--text-secondary)',
                        border: '1px solid var(--border)', borderRadius: '10px',
                        padding: '10px 20px', fontSize: '13px', fontWeight: 500,
                        cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
                    }}>← Go Back</button>
                    <button onClick={() => navigate('/')} style={{
                        background: 'var(--accent)', color: 'white', border: 'none',
                        borderRadius: '10px', padding: '10px 20px', fontSize: '13px',
                        fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
                    }}>Go Home</button>
                </div>
            </div>
        </div>
    );
};
export default NotFoundPage;