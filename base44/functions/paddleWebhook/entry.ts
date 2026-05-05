import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const eventType = body.event_type;
    const data = body.data;

    console.log('Paddle webhook event:', eventType);

    if (eventType === 'subscription.created' || eventType === 'subscription.updated') {
      const customData = data.custom_data || {};
      const userId = customData.user_id;
      if (!userId) {
        console.log('No user_id in custom_data, skipping');
        return Response.json({ ok: true });
      }

      const planMap = {
        // Starter
        'pri_01kmas8nvfg1w0rrsy9x8y6h7d': 'STARTER',
        'pri_01kmasck9syterh7s84xgjed31': 'STARTER',
        // Pro
        'pri_01kmasj6athbhqdndc6n6b5xep': 'PRO_HOSTED',
        'pri_01kmask2znj5my4ytv6vrz7bx3': 'PRO_HOSTED',
        // Team
        'pri_01kmasp1hcck6npzce3bze249z': 'TEAM',
        'pri_01kmasq01txt4h8kk4vdyqsr8g': 'TEAM',
      };

      const priceId = data.items?.[0]?.price?.id;
      const plan = planMap[priceId] || 'PRO_BYOK';
      const status = data.status === 'active' ? 'ACTIVE' : data.status === 'past_due' ? 'PAST_DUE' : 'CANCELLED';

      // Find existing subscription for user
      const existing = await base44.asServiceRole.entities.Subscription.filter({ user_id: userId });

      const subData = {
        user_id: userId,
        plan,
        status,
        paddle_subscription_id: data.id,
        paddle_customer_id: data.customer_id,
        start_date: data.started_at || new Date().toISOString(),
      };

      if (existing.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existing[0].id, subData);
      } else {
        await base44.asServiceRole.entities.Subscription.create(subData);
      }

      console.log(`Subscription ${existing.length > 0 ? 'updated' : 'created'} for user ${userId}`);
    }

    if (eventType === 'subscription.canceled') {
      const subId = data.id;
      const subs = await base44.asServiceRole.entities.Subscription.filter({ paddle_subscription_id: subId });
      if (subs.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(subs[0].id, { status: 'CANCELLED', end_date: new Date().toISOString() });
        console.log('Subscription cancelled:', subId);
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});