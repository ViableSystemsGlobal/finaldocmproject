import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    console.log('🌟 Fetching active Word of the Year...');

    // Fetch active theme
    const { data: theme, error } = await supabase
      .from('annual_themes')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('❌ Error fetching word of year:', {
        code: error.code,
        message: error.message,
        details: error.details
      });
      
      // Table doesn't exist
      if (error.code === '42P01') {
        console.log('ℹ️  Table does not exist - run SIMPLE_WORD_OF_YEAR_SQL.sql');
        return NextResponse.json({
          success: true,
          data: null,
          message: 'Table not created yet'
        });
      }
      
      // Return null if no active theme (not an error state)
      if (error.code === 'PGRST116') {
        console.log('ℹ️  No active Word of the Year set');
        return NextResponse.json({
          success: true,
          data: null,
          message: 'No active Word of the Year'
        });
      }

      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch Word of the Year',
          debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    }

    // Fetch related sermon if sermon_id exists
    let sermon = null;
    if (theme.sermon_id) {
      const { data: sermonData } = await supabase
        .from('sermons')
        .select('id, title, slug, speaker, thumbnail_image')
        .eq('id', theme.sermon_id)
        .single();
      
      sermon = sermonData;
    }

    console.log('✅ Word of the Year loaded:', theme.theme_word);

    return NextResponse.json({
      success: true,
      data: {
        ...theme,
        sermon
      },
      message: 'Word of the Year loaded successfully'
    });

  } catch (error) {
    console.error('❌ Unexpected error in word-of-year API:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

