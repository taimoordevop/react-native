const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDatabase() {
  try {
    console.log('Starting database fix...');

    // 1. Drop existing foreign key constraints
    console.log('Dropping existing foreign key constraints...');
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
        ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_user_id_fkey;
        ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_user_id_fkey;
      `
    });

    // 2. Add correct foreign key constraints
    console.log('Adding correct foreign key constraints...');
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE transactions ADD CONSTRAINT transactions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        
        ALTER TABLE budgets ADD CONSTRAINT budgets_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        
        ALTER TABLE categories ADD CONSTRAINT categories_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      `
    });

    console.log('Database fix completed successfully!');
  } catch (error) {
    console.error('Error fixing database:', error);
  }
}

fixDatabase(); 