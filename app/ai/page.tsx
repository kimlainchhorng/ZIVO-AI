const loadVersions = async () => {
    try {
        setVersionError(false);
        const response = await fetch('/api/backup-list');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        // Handle the fetched data
    } catch (error) {
        console.error('Error fetching versions:', error);
        setVersionError(true);
    }
};