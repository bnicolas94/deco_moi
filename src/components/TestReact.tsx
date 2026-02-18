import React, { useState } from 'react';

export default function TestReact() {
    const [count, setCount] = useState(0);
    return (
        <div style={{ padding: '20px', border: '2px solid red', margin: '20px 0' }}>
            <h2>Test React Integration</h2>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)} style={{ padding: '10px', background: '#eee' }}>
                Increment
            </button>
        </div>
    );
}
