// AI Builder Component

'use client';

import React, { useState } from 'react';

const AIBuilder = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Assuming there's an API to call that processes the input
        const response = await fetch('/api/generate-site', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ prompt: input }),
        });
        const data = await response.json() as { result?: string; error?: string };
        setOutput(data.result ?? data.error ?? '');
    };

    return (
        <div>
            <h1>AI Builder</h1>
            <form onSubmit={handleSubmit}>
                <textarea value={input} onChange={handleInputChange} placeholder="Enter your input here..." />
                <button type="submit">Submit</button>
            </form>
            <div>
                <h2>Output</h2>
                <p>{output}</p>
            </div>
        </div>
    );
};

export default AIBuilder;