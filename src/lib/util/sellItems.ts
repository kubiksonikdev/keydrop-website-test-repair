import type { Item } from '@prisma/client';
import { createToast } from '../toast';
import { invalidateAll } from '$app/navigation';

export async function sellItems(items: Item[]) {
  const IDs = items.map((i) => i.dropId);
  const res = await fetch('/api/skins/sell/', {
    method: 'POST',
    body: JSON.stringify({ itemIDs: IDs }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  await invalidateAll();
  createToast({
    type: res.ok ? 'success' : 'error',
    header: res.ok ? 'sukces' : 'błąd',
    message: (await res.json()).message
  });
  return res;
}
