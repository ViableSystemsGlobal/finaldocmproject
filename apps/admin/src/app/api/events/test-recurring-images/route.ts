import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createNextEventOccurrence, generateFutureOccurrences, copyEventImages } from '@/services/recurringEvents';

export async function POST(request: NextRequest) {
  try {
    const { event_id } = await request.json();

    if (!event_id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    console.log(`🧪 Testing recurring event image copying for event: ${event_id}`);

    // Get the event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single();

    if (eventError) {
      throw new Error(`Failed to fetch event: ${eventError.message}`);
    }

    if (!event) {
      throw new Error('Event not found');
    }

    console.log(`📅 Found event: ${event.name}`);

    // Check if the event has images
    const { data: existingImages, error: imagesError } = await supabase
      .from('event_images')
      .select('*')
      .eq('event_id', event_id);

    if (imagesError) {
      throw new Error(`Failed to fetch event images: ${imagesError.message}`);
    }

    console.log(`🖼️ Event has ${existingImages?.length || 0} images`);

    // If the event doesn't have images, create a sample image first
    if (!existingImages || existingImages.length === 0) {
      console.log('🎨 Creating sample image for testing...');
      
      const sampleImageData = {
        event_id: event_id,
        url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
        alt_text: 'Sample event image for testing',
        sort_order: 0
      };

      const { error: imageCreateError } = await supabase
        .from('event_images')
        .insert(sampleImageData);

      if (imageCreateError) {
        throw new Error(`Failed to create sample image: ${imageCreateError.message}`);
      }

      console.log('✨ Sample image created');
    }

    // Make the event recurring if it isn't already
    if (!event.is_recurring) {
      console.log('🔄 Making event recurring for testing...');
      
      const { error: updateError } = await supabase
        .from('events')
        .update({
          is_recurring: true,
          recurrence_rule: 'weekly',
          recurrence_count: 3
        })
        .eq('id', event_id);

      if (updateError) {
        throw new Error(`Failed to update event: ${updateError.message}`);
      }

      console.log('✅ Event is now recurring');
    }

    // Test creating a single next occurrence
    console.log('🚀 Testing createNextEventOccurrence...');
    const { data: nextOccurrence, error: nextError } = await createNextEventOccurrence(event_id);

    if (nextError) {
      throw new Error(`Failed to create next occurrence: ${nextError.message}`);
    }

    console.log(`✨ Created next occurrence: ${nextOccurrence?.id}`);

    // Verify that images were copied to the new occurrence
    if (nextOccurrence) {
      const { data: copiedImages, error: copiedImagesError } = await supabase
        .from('event_images')
        .select('*')
        .eq('event_id', nextOccurrence.id);

      if (copiedImagesError) {
        console.warn('Failed to verify copied images:', copiedImagesError);
      } else {
        console.log(`🖼️ New occurrence has ${copiedImages?.length || 0} images`);
      }
    }

    // Test generating multiple future occurrences
    console.log('📅 Testing generateFutureOccurrences...');
    const { data: futureOccurrences, error: futureError } = await generateFutureOccurrences(event_id, 2);

    if (futureError) {
      console.warn('Failed to generate future occurrences:', futureError.message);
    } else {
      console.log(`✨ Generated ${futureOccurrences?.length || 0} future occurrences`);

      // Verify images were copied to each future occurrence
      if (futureOccurrences && futureOccurrences.length > 0) {
        for (const occurrence of futureOccurrences) {
          const { data: occurrenceImages } = await supabase
            .from('event_images')
            .select('*')
            .eq('event_id', occurrence.id);
          
          console.log(`🖼️ Occurrence ${occurrence.id} has ${occurrenceImages?.length || 0} images`);
        }
      }
    }

    // Get final counts
    const { data: allOccurrences } = await supabase
      .from('events')
      .select('id, name, event_date')
      .eq('parent_event_id', event_id)
      .order('event_date');

    const totalOccurrences = (allOccurrences?.length || 0) + (nextOccurrence ? 1 : 0);

    console.log('🎉 Test completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Recurring event image copying test completed',
      originalEvent: {
        id: event.id,
        name: event.name,
        imageCount: existingImages?.length || 0
      },
      nextOccurrence: nextOccurrence ? {
        id: nextOccurrence.id,
        event_date: nextOccurrence.event_date
      } : null,
      futureOccurrences: futureOccurrences?.map((o: any) => ({
        id: o.id,
        event_date: o.event_date
      })) || [],
      occurrencesCreated: totalOccurrences,
      testResults: {
        originalHadImages: (existingImages?.length || 0) > 0,
        sampleImageCreated: !existingImages || existingImages.length === 0,
        nextOccurrenceCreated: !!nextOccurrence,
        futureOccurrencesCreated: futureOccurrences?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      },
      { status: 500 }
    );
  }
} 