// Update your existing fetch function in api.js
async function fetchJobs(tab = 'permohonan') {
    // We append the tab parameter so the Backend knows which sheet to read
    const url = `${CONFIG.SCRIPT_URL}?action=listJobs&tab=${tab}`;
    
    try {
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.status === 'success') {
            return result.data;
        } else {
            console.error("API Error:", result.message);
            return [];
        }
    } catch (error) {
        console.error("Network Error:", error);
        return [];
    }
}
