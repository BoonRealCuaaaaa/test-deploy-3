export const SHARED_APP_CONFIG = {
  MODE: import.meta.env.MODE,
  HELPDESK_PLUGINS_API_URL: import.meta.env.VITE_HELPDESK_PLUGINS_API_URL||import.meta.env["VITE_HELPDESK_PLUGINS_API_URL"],
};

console.log(import.meta.env)
console.log(import.meta.env.VITE_HELPDESK_PLUGINS_API_URL)
console.log(import.meta.env["VITE_HELPDESK_PLUGINS_API_URL"])
