import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Account moved into Settings — keep this path working for old links.
export const load: PageServerLoad = async () => {
	redirect(301, '/settings/account');
};
