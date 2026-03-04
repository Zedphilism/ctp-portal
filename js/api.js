const API = {
  // Internal helper: standard GET fetch with per-cell default params from config.js
  async request(action, params = {}) {
    const defaults = window.CTP_API_DEFAULT_PARAMS || {};
    const q = new URLSearchParams({ action, ...defaults, ...params });
    const url = `${window.CTP_API_BASE}?${q.toString()}`;

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
    });

    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return await res.json();
  },

  ping: () => API.request("ping"),
  meta: () => API.request("meta"),

  // Allow passing { tab: "wdp" } or other aliases expected by backend.
  listJobs: (params) => API.request("listJobs", params),

  // Allow passing tab hints when querying a single job.
  getJob: (jobId, params = {}) => API.request("getJob", { jobId, ...params }),

  listInspectors: (params) => API.request("listInspectors", params),
};
