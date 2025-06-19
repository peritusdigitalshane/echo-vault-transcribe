
-- Create a table to store Stripe configuration settings
CREATE TABLE public.stripe_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_amount INTEGER NOT NULL, -- Amount in cents (995 for $9.95)
  price_currency TEXT NOT NULL DEFAULT 'aud',
  price_interval TEXT NOT NULL DEFAULT 'month',
  stripe_price_id TEXT, -- Stripe Price ID for the subscription
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default pricing
INSERT INTO public.stripe_settings (price_amount, price_currency, price_interval)
VALUES (995, 'aud', 'month');

-- Enable RLS (only super admins should manage this)
ALTER TABLE public.stripe_settings ENABLE ROW LEVEL SECURITY;

-- Policy to allow super admins to manage stripe settings
CREATE POLICY "super_admin_stripe_settings" ON public.stripe_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Create subscribers table to track subscription status
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_status TEXT, -- active, canceled, past_due, etc.
  subscription_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for subscribers
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "users_own_subscription" ON public.subscribers
FOR SELECT
USING (user_id = auth.uid() OR email = auth.email());

-- Edge functions can manage subscriptions (using service role key)
CREATE POLICY "service_manage_subscriptions" ON public.subscribers
FOR ALL
USING (true);
