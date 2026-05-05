import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const PADDLE_PRICES = {
  starter_monthly: 'pri_01kmas8nvfg1w0rrsy9x8y6h7d',
  starter_yearly: 'pri_01kmasck9syterh7s84xgjed31',
  pro_monthly: 'pri_01kmasj6athbhqdndc6n6b5xep',
  pro_yearly: 'pri_01kmask2znj5my4ytv6vrz7bx3',
  team_monthly: 'pri_01kmasp1hcck6npzce3bze249z',
  team_yearly: 'pri_01kmasq01txt4h8kk4vdyqsr8g',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, billing_cycle } = await req.json();
    const key = `${plan}_${billing_cycle}`;
    const priceId = PADDLE_PRICES[key];

    if (!priceId) {
      return Response.json({ error: 'Invalid plan or billing cycle' }, { status: 400 });
    }

    return Response.json({
      priceId,
      email: user.email,
      userId: user.id,
      clientToken: Deno.env.get('PADDLE_CLIENT_TOKEN'),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});