import { supabase } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'

async function runMigration() {
  try {
    console.log('Starting user profiles migration...')
    
    // Read the SQL migration file
    const migrationPath = path.join(process.cwd(), 'src/scripts/create-user-profiles-table.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split into individual statements (basic splitting by semicolon)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`Executing statement ${i + 1}/${statements.length}...`)
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error)
        console.error('Statement:', statement.substring(0, 200) + '...')
        // Continue with other statements
      } else {
        console.log(`Statement ${i + 1} executed successfully`)
      }
    }
    
    console.log('Migration completed!')
    
    // Test the new functions
    console.log('Testing user profile functions...')
    
    // Test getting user permissions
    const { data: testUsers } = await supabase.auth.admin.listUsers()
    if (testUsers && testUsers.users.length > 0) {
      const testUserId = testUsers.users[0].id
      console.log('Testing with user:', testUserId)
      
      const { data: permissions, error: permError } = await supabase
        .rpc('get_user_permissions', { user_uuid: testUserId })
      
      if (permError) {
        console.error('Error testing permissions function:', permError)
      } else {
        console.log('User permissions:', permissions)
      }
    }
    
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

// Run if called directly
if (require.main === module) {
  runMigration()
}

export { runMigration } 