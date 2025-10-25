# Supabase Setup for Navigation System

The navigation system is designed to work with or without Supabase. If Supabase is not configured, the app will use default navigation data.

## Setup Instructions

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Create environment file** `.env.local` in the web app root with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. **Create the navigation table** in your Supabase database:
   ```sql
   CREATE TABLE navigation (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     label TEXT NOT NULL,
     href TEXT NOT NULL,
     "order" INTEGER NOT NULL DEFAULT 0,
     is_active BOOLEAN DEFAULT true,
     parent_id UUID REFERENCES navigation(id),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create index for better performance
   CREATE INDEX idx_navigation_parent_id ON navigation(parent_id);
   CREATE INDEX idx_navigation_order ON navigation("order");
   CREATE INDEX idx_navigation_active ON navigation(is_active);
   ```

4. **Insert sample navigation data** (optional):
   ```sql
   INSERT INTO navigation (label, href, "order", is_active) VALUES
   ('Home', '/', 0, true),
   ('About', '/about', 1, true),
   ('Events', '/events', 2, true),
   ('Contact', '/contact', 4, true);

   -- Add Media parent item
   INSERT INTO navigation (id, label, href, "order", is_active) VALUES
   ('media-parent', 'Media', '#', 3, true);

   -- Add Media children
   INSERT INTO navigation (label, href, "order", is_active, parent_id) VALUES
   ('Sermons', '/media/sermons', 0, true, 'media-parent'),
   ('Gallery', '/media/gallery', 1, true, 'media-parent'),
   ('Blog', '/media/blog', 2, true, 'media-parent');
   ```

## Fallback Behavior

If Supabase is not configured or the navigation table doesn't exist, the app will automatically use the default navigation structure defined in the code. This ensures the app continues to work even without a database.

## Admin Interface

The admin interface (in the admin app) provides a UI to manage navigation items when Supabase is properly configured. 