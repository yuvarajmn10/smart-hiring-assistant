const Spinner = ({ size = 36, text = 'Loading...' }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', gap: '14px' }}>
        <div style={{
            width: `${size}px`, height: `${size}px`,
            border: '2px solid var(--tint-06)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin .8s linear infinite',
        }} />
        {text && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{text}</p>}
    </div>
);
export default Spinner;