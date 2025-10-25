# Google Maps API Setup for Location Features

The meetings system includes Google Places Autocomplete for location selection. Follow these steps to enable this feature:

## 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Places API** (for autocomplete)
   - **Maps JavaScript API** (for map functionality)
   - **Maps Embed API** (for embedded maps in transport routes)

4. Go to "Credentials" and create an API Key
5. Restrict the API key (recommended):
   - **Application restrictions**: HTTP referrers (add your domain)
   - **API restrictions**: Select "Places API", "Maps JavaScript API", and "Maps Embed API"

## 2. Configure Environment Variable

Add your API key to your environment variables:

```bash
# .env.local or .env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

## 3. Verify Setup

1. Restart your development server
2. Create or edit a meeting
3. The location field should now show:
   - A map pin icon
   - Autocomplete suggestions as you type
   - Loading indicator while Maps API loads

## 4. Fallback Behavior

If the Google Maps API is not configured or fails to load:
- The location field will still work as a regular text input
- Users can manually enter location names
- All other meeting functionality remains unaffected

## 5. Pricing

Google Maps API has a free tier that includes:
- 1,000 requests per month for Places API
- After free tier: $0.017 per request

For most church applications, the free tier should be sufficient.

## 6. Customization

You can customize the autocomplete behavior in `components/GooglePlacesInput.tsx`:
- Change country restrictions (currently set to 'us')
- Modify place types (currently 'establishment' and 'geocode')
- Adjust the search fields returned by the API

## Troubleshooting

**API not loading**: Check browser console for errors
**No autocomplete**: Verify API key and that Places API is enabled
**Wrong locations**: Adjust country restrictions in the component 