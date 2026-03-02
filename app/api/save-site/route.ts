import fs from 'fs';
import path from 'path';

const PROJECTS_DIR = path.join(process.cwd(), 'projects');

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { projectId, htmlContent, metadata } = req.body;

        // Validate input
        if (!projectId || !htmlContent) {
            return res.status(400).json({ error: 'Project ID and HTML content are required.' });
        }

        // Create projects directory if it does not exist
        if (!fs.existsSync(PROJECTS_DIR)) {
            fs.mkdirSync(PROJECTS_DIR, { recursive: true });
        }

        // Define the file path
        const filePath = path.join(PROJECTS_DIR, `${projectId}.html`);

        // Save the HTML content to a file
        try {
            fs.writeFileSync(filePath, htmlContent);
            // Ideally, you would save metadata to a database or a separate file
            return res.status(200).json({ message: 'Site saved successfully!', metadata });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to save the project: ' + error.message });
        }
    } else {
        // Handle unsupported methods
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}