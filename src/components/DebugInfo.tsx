import React, { useEffect, useState } from 'react';

export default function DebugInfo() {
    const [info, setInfo] = useState<any>({});

    useEffect(() => {
        setInfo({
            userAgent: window.navigator.userAgent,
            reactVersion: React.version,
            location: window.location.href,
            windowReact: (window as any).React ? 'Present' : 'Absent',
        });
        console.log('DebugInfo mounted successfully');
    }, []);

    return (
        <div style={{ padding: '20px', background: '#ffeeba', color: '#856404', border: '1px solid #ffeeba', margin: '20px' }}>
            <h3>Debug Info</h3>
            <pre>{JSON.stringify(info, null, 2)}</pre>
            <p>If you can see this, React is rendering correctly.</p>
        </div>
    );
}
