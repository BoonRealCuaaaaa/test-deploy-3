import axios from 'axios';

import { SHARED_APP_CONFIG } from '../../app-config';

console.log(SHARED_APP_CONFIG)

const helpdeskPluginsApiAxios = axios.create({
  baseURL: SHARED_APP_CONFIG.HELPDESK_PLUGINS_API_URL,
  withCredentials: true,
});

export default helpdeskPluginsApiAxios;
