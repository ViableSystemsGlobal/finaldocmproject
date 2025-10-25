'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Sparkles, Save, Eye, Calendar, BookOpen, Image, Loader2 } from 'lucide-react';

interface AnnualTheme {
  id: string;
  year: number;
  theme_word: string;
  description: string;
  sermon_id: string | null;
  scripture_reference: string | null;
  background_image_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface Sermon {
  id: string;
  title: string;
  speaker: string;
  sermon_date: string;
}

export default function WordOfYearPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<AnnualTheme | null>(null);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    theme_word: '',
    description: '',
    sermon_id: '',
    scripture_reference: '',
    background_image_url: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load active theme
      const { data: themeData, error: themeError } = await supabase
        .from('annual_themes')
        .select('*')
        .eq('is_active', true)
        .single();

      if (themeError) {
        if (themeError.code === '42P01') {
          console.error('❌ Table does not exist. Please run: SIMPLE_WORD_OF_YEAR_SQL.sql');
          toast({
            variant: 'destructive',
            title: 'Database Setup Required',
            description: 'Please run SIMPLE_WORD_OF_YEAR_SQL.sql in Supabase first',
          });
        } else if (themeError.code !== 'PGRST116') {
          // PGRST116 = no rows returned (expected if no theme set yet)
          console.error('Error loading theme:', themeError);
        }
      }

      if (themeData) {
        setTheme(themeData);
        setFormData({
          year: themeData.year,
          theme_word: themeData.theme_word,
          description: themeData.description,
          sermon_id: themeData.sermon_id || '',
          scripture_reference: themeData.scripture_reference || '',
          background_image_url: themeData.background_image_url || '',
        });
      }

      // Load sermons for dropdown
      const { data: sermonsData, error: sermonsError } = await supabase
        .from('sermons')
        .select('id, title, speaker, sermon_date')
        .eq('status', 'published')
        .order('sermon_date', { ascending: false })
        .limit(50);

      if (!sermonsError) {
        setSermons(sermonsData || []);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.theme_word.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Theme word is required',
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Description is required',
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: tenantData } = await supabase
        .from('tenant_settings')
        .select('id')
        .single();

      const themeData = {
        year: formData.year,
        theme_word: formData.theme_word.trim(),
        description: formData.description.trim(),
        sermon_id: (formData.sermon_id && formData.sermon_id !== 'none') ? formData.sermon_id : null,
        scripture_reference: formData.scripture_reference?.trim() || null,
        background_image_url: formData.background_image_url?.trim() || null,
        is_active: true,
        tenant_id: tenantData?.id,
        created_by: user?.id,
      };

      if (theme) {
        // Update existing theme
        const { error } = await supabase
          .from('annual_themes')
          .update(themeData)
          .eq('id', theme.id);

        if (error) {
          console.error('❌ Error updating theme:', error);
          throw error;
        }

        toast({
          title: 'Success!',
          description: 'Word of the Year updated successfully',
        });
      } else {
        // Create new theme
        const { error } = await supabase
          .from('annual_themes')
          .insert([themeData]);

        if (error) {
          console.error('❌ Error creating theme:', error);
          if (error.code === '42P01') {
            toast({
              variant: 'destructive',
              title: 'Database Error',
              description: 'Please run SIMPLE_WORD_OF_YEAR_SQL.sql in Supabase first',
            });
            return;
          }
          throw error;
        }

        toast({
          title: 'Success!',
          description: 'Word of the Year created successfully',
        });
      }

      loadData();

    } catch (error: any) {
      console.error('❌ Error saving theme:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save Word of the Year',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 rounded-2xl shadow-lg">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Word of the Year</h1>
          <p className="text-gray-600 mt-1">Set your church's annual spiritual theme and focus</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Sparkles className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">
              💡 What is "Word of the Year"?
            </h3>
            <p className="text-sm text-blue-800 leading-relaxed">
              Set a spiritual focus word or theme for the year that will be prominently displayed on your homepage. 
              This helps unite your congregation around a central biblical truth or calling from God. 
              Connect it to a sermon series and scripture to deepen the impact!
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50">
          <CardTitle className="text-2xl">Theme Settings</CardTitle>
          <CardDescription>
            This will be displayed prominently on your homepage
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Year */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="year" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Year
              </Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                className="mt-2"
                min="2020"
                max="2100"
              />
            </div>

            <div>
              <Label htmlFor="scripture" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Scripture Reference
              </Label>
              <Input
                id="scripture"
                value={formData.scripture_reference}
                onChange={(e) => setFormData(prev => ({ ...prev, scripture_reference: e.target.value }))}
                placeholder="Matthew 11:28-30"
                className="mt-2"
              />
            </div>
          </div>

          {/* Theme Word */}
          <div>
            <Label htmlFor="theme_word" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Theme Word / Phrase *
            </Label>
            <Input
              id="theme_word"
              value={formData.theme_word}
              onChange={(e) => setFormData(prev => ({ ...prev, theme_word: e.target.value }))}
              placeholder="Rest, Faith, Breakthrough, etc."
              className="mt-2 text-2xl font-bold"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Keep it short and memorable - one word or short phrase
            </p>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="This year, God is calling us to find rest in Him, to pause from our striving and trust in His perfect goodness..."
              className="mt-2"
              rows={5}
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Explain what this theme means and how it applies to your congregation (2-3 sentences)
            </p>
          </div>

          {/* Related Sermon */}
          <div>
            <Label htmlFor="sermon">Related Sermon Series (Optional)</Label>
            <Select 
              value={formData.sermon_id || undefined} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, sermon_id: value }))}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a sermon..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No sermon selected</SelectItem>
                {sermons.map((sermon) => (
                  <SelectItem key={sermon.id} value={sermon.id}>
                    {sermon.title} - {sermon.speaker}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              Link to a sermon that explains or introduces this theme
            </p>
          </div>

          {/* Background Image */}
          <div>
            <Label htmlFor="background_image" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Background Image URL (Optional)
            </Label>
            <div className="space-y-3">
              <Input
                id="background_image"
                value={formData.background_image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, background_image_url: e.target.value }))}
                placeholder="https://example.com/background.jpg"
                className="mt-2"
              />
              
              {/* Image Preview */}
              {formData.background_image_url && (
                <div className="relative">
                  <div className="relative h-48 bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-300">
                    <img 
                      src={formData.background_image_url} 
                      alt="Background preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="flex items-center justify-center h-full bg-gray-100">
                              <div class="text-center text-gray-500">
                                <svg class="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p class="text-sm">Invalid image URL</p>
                              </div>
                            </div>
                          `;
                        }
                      }}
                    />
                    {/* Word Preview Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40 flex items-center justify-center">
                      <div className="text-center text-white">
                        <p className="text-sm font-semibold mb-2">2025 WORD OF THE YEAR</p>
                        <h2 className="text-5xl font-bold uppercase tracking-wider">
                          {formData.theme_word || 'YOUR WORD'}
                        </h2>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-center text-gray-600 mt-2">Preview of how it will look on homepage</p>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Optional: Add a background image to make it more visually appealing
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-6 border-t">
            <Button
              onClick={handleSave}
              disabled={saving || !formData.theme_word.trim() || !formData.description.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {theme ? 'Update' : 'Save'} Word of the Year
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => window.open('/', '_blank')}
              size="lg"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview on Homepage
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Previous Themes */}
      <Card>
        <CardHeader>
          <CardTitle>Past Themes</CardTitle>
          <CardDescription>View your church's spiritual journey through the years</CardDescription>
        </CardHeader>
        <CardContent>
          <PreviousThemesList />
        </CardContent>
      </Card>
    </div>
  );
}

// Component to show previous themes
function PreviousThemesList() {
  const [themes, setThemes] = useState<AnnualTheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreviousThemes();
  }, []);

  const loadPreviousThemes = async () => {
    try {
      const { data, error } = await supabase
        .from('annual_themes')
        .select('*')
        .eq('is_active', false)
        .order('year', { ascending: false })
        .limit(10);

      if (!error) {
        setThemes(data || []);
      }
    } catch (error) {
      console.error('Error loading previous themes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-6">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
      </div>
    );
  }

  if (themes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p>No previous themes yet</p>
        <p className="text-sm mt-1">Your theme history will appear here as you add new years</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {themes.map((theme) => (
        <div 
          key={theme.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg text-white font-bold">
              {theme.year}
            </div>
            <div>
              <p className="font-bold text-lg text-gray-900">"{theme.theme_word}"</p>
              <p className="text-sm text-gray-600 line-clamp-1">{theme.description}</p>
              {theme.scripture_reference && (
                <p className="text-xs text-blue-600 mt-1">{theme.scripture_reference}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

