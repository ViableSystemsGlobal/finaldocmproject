const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createPaymentCategoriesTable() {
  console.log('🔧 Creating payment_categories table...')
  
  try {
    // First, let's check if the table exists by trying to query it
    const { data, error } = await supabase
      .from('payment_categories')
      .select('count(*)')
      .limit(1)
    
    if (!error) {
      console.log('✅ Table already exists!')
      console.log('📊 Current count:', data)
      return
    }
    
    console.log('❌ Table does not exist, need to create it')
    console.log('Error:', error.message)
    
    // Since we can't create tables via the client, let's suggest the SQL
    console.log('\n🔧 Please run this SQL in your Supabase SQL Editor:')
    console.log('\n--- COPY BELOW ---')
    console.log(`
CREATE TABLE public.payment_categories (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      TEXT        NOT NULL UNIQUE,
  description               TEXT,
  category_type             TEXT        NOT NULL DEFAULT 'other',
  is_active                 BOOLEAN     NOT NULL DEFAULT true,
  requires_reference        BOOLEAN     NOT NULL DEFAULT false,
  processing_fee_percentage DECIMAL(5,2),
  "order"                   INTEGER     NOT NULL DEFAULT 0,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_payment_categories_active ON public.payment_categories(is_active);
CREATE INDEX idx_payment_categories_order ON public.payment_categories("order");
CREATE INDEX idx_payment_categories_type ON public.payment_categories(category_type);

-- RLS
ALTER TABLE public.payment_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read payment_categories"
  ON public.payment_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow service role to manage payment_categories"
  ON public.payment_categories FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow admin users to manage payment_categories"
  ON public.payment_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Permissions
GRANT SELECT ON public.payment_categories TO authenticated;
GRANT ALL ON public.payment_categories TO service_role;
`)
    console.log('--- END COPY ---\n')
    
  } catch (err) {
    console.error('💥 Unexpected error:', err)
  }
}

createPaymentCategoriesTable() 