// 📁 File: src/routes/service/+layout.ts

import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data }) => {
  return {
    serviceName: data?.serviceName ?? 'Unnamed Service'
  };
};
