import { i18n } from '$lib';
import { db, userFromSessionID } from '$lib/server';
import type { RequestEvent } from '@sveltejs/kit';
import { get } from 'svelte/store';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function POST(event: RequestEvent) {
  const lang = event.cookies.get('lang') as 'pl' | 'en';
  const langData = get(i18n)[lang];
  const sessionId = event.cookies.get('session_id');
  const { itemIDs, prices }: { itemIDs: string[]; prices: number[] } = await event.request.json();

  if (!sessionId)
    return new Response(JSON.stringify({ message: langData.toasts.error.messages.noSessionID }), {
      status: 404
    });
  const session = await db.session.findUnique({ where: { id: sessionId } });
  if (!session)
    return new Response(JSON.stringify({ message: langData.toasts.error.messages.noSession }), {
      status: 404
    });
  const user = await userFromSessionID(sessionId);
  if (!user)
    return new Response(JSON.stringify({ message: langData.toasts.error.messages.userNotExists }), {
      status: 404
    });

  const priceSum = prices.reduce((n, o) => n + o, 0);
  const balanceToAdd = Math.round((priceSum + Number.EPSILON) * 100) / 100;

  const updatedUser = await db.user.update({
    where: {
      id: session.userId
    },
    data: {
      inventory: {
        updateMany: {
          where: {
            dropId: { in: itemIDs }
          },
          data: { sold: true }
        }
      },
      balance: {
        increment: balanceToAdd
      },
      goldBalance: {
        increment: Math.round(balanceToAdd * 2.5)
      }
    }
  });
  return new Response(
    JSON.stringify({ message: langData.toasts.success.messages.sell, data: updatedUser }),
    {
      status: 200
    }
  );
}
