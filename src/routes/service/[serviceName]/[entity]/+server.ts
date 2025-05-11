// Optional route: proxy insert from front-end via /service/[serviceName]/[entity]
import { redirect } from '@sveltejs/kit';

export const POST = async ({ request, params, fetch }) => {
  const { serviceName, entity } = params;
  const formData = await request.formData();

  const payload = Object.fromEntries(formData.entries());

  const res = await fetch(`/api/services/${serviceName}/${entity}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json();
    console.error('❌ Console route insert error:', errorData);
    throw redirect(303, `/service/${serviceName}/${entity}?error=1`);
  }

  throw redirect(303, `/service/${serviceName}/${entity}?success=1`);
};
