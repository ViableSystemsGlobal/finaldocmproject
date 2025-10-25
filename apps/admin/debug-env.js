console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL); console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

console.log('🔍 Environment Debug:')
console.log('EXPO_ACCESS_TOKEN:', process.env.EXPO_ACCESS_TOKEN)
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('All env keys containing EXPO:', Object.keys(process.env).filter(key => key.includes('EXPO')))

// Check if the token exists but is empty/undefined
if (process.env.EXPO_ACCESS_TOKEN) {
  console.log('✅ EXPO_ACCESS_TOKEN is loaded')
  console.log('Token length:', process.env.EXPO_ACCESS_TOKEN.length)
  console.log('Token preview:', process.env.EXPO_ACCESS_TOKEN.substring(0, 10) + '...')
} else {
  console.log('❌ EXPO_ACCESS_TOKEN is not loaded')
  console.log('Expected token: y8JtcUk0toh5MRip8LTzwFJH65BfaDM8IdRlmn-o')
}
