const API = {
  // Internal helper: Standard GET fetch
  async request(action, params = {}) {
    const q = new URLSearchParams({ action, ...params });
    const url = `${window.CTP_API_BASE}?${q.toString()}`;
    
    // Google Apps Script redirects to the content; fetch follows automatically.
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // Avoids preflight CORS trigger in some cases
    });

    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return await res.json();
  },

  ping: () => API.request("ping"),
  meta: () => API.request("meta"),
  listJobs: (params) => API.request("listJobs", params),
  getJob: (jobId) => API.request("getJob", { jobId }),
  listInspectors: (params) => API.request("listInspectors", params),
};