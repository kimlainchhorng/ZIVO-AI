// Use the 'use client' directive to indicate that this component should be rendered on the client side.
'use client';

import React, { useState } from 'react';
import { AIBuilder } from './AIBuilder';

const Page = () => {
    const [projectId, setProjectId] = useState('');
    const [htmlContent, setHtmlContent] = useState('');

    const handleSave = () => {
        // Save logic goes here
        console.log('Saving project with ID:', projectId);
        console.log('HTML Content:', htmlContent);
    };

    return (
        <div>
            <h1>AI Builder</h1>
            <AIBuilder 
                onProjectIdChange={(id) => setProjectId(id)} 
                onHtmlChange={(content) => setHtmlContent(content)}
            />
            <button onClick={handleSave}>Save</button>
        </div>
    );
};

export default Page;