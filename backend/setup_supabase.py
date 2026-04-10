#!/usr/bin/env python3
"""
Interactive Supabase Setup Script
Helps you set up Supabase for the Fishing Lure Classifier
"""

import os
import shutil

def main():
    print("=" * 70)
    print("Fishing Lure Classifier - Supabase Setup Wizard")
    print("=" * 70)
    print()
    
    # Check if .env already exists
    if os.path.exists('.env'):
        print("✓ .env file already exists")
        print()
        response = input("Do you want to reconfigure it? (y/N): ").strip().lower()
        if response != 'y':
            print("\nSetup cancelled. Your existing .env file is unchanged.")
            return
        print()
    
    # Check if template exists
    if not os.path.exists('env_template.txt'):
        print("❌ Error: env_template.txt not found!")
        print("   Make sure you're in the project root directory.")
        return
    
    print("Step 1: Creating .env file")
    print("-" * 70)
    
    # Copy template to .env
    shutil.copy('env_template.txt', '.env')
    print("✓ Created .env file from template")
    print()
    
    print("Step 2: Getting Supabase Credentials")
    print("-" * 70)
    print()
    print("To get your Supabase credentials:")
    print("1. Go to https://supabase.com")
    print("2. Sign in or create an account")
    print("3. Create a new project (or select existing)")
    print("4. Go to Settings → API")
    print("5. You'll need:")
    print("   - Project URL")
    print("   - anon public key")
    print("   - service_role key (click 'Reveal' to see it)")
    print()
    
    # Get credentials from user
    print("Enter your Supabase credentials:")
    print()
    
    supabase_url = input("Supabase URL (https://xxx.supabase.co): ").strip()
    if not supabase_url:
        print("\n❌ Setup cancelled - no URL provided")
        return
    
    supabase_anon_key = input("Supabase anon key: ").strip()
    if not supabase_anon_key:
        print("\n❌ Setup cancelled - no anon key provided")
        return
    
    supabase_service_key = input("Supabase service_role key: ").strip()
    if not supabase_service_key:
        print("\n❌ Setup cancelled - no service_role key provided")
        return
    
    print()
    openai_api_key = input("OpenAI API key (optional, press Enter to skip): ").strip()
    
    # Update .env file
    print()
    print("Step 3: Updating .env file")
    print("-" * 70)
    
    with open('.env', 'r') as f:
        env_content = f.read()
    
    # Replace placeholder values
    env_content = env_content.replace('SUPABASE_URL=your-project-url-here', f'SUPABASE_URL={supabase_url}')
    env_content = env_content.replace('SUPABASE_ANON_KEY=your-anon-key-here', f'SUPABASE_ANON_KEY={supabase_anon_key}')
    env_content = env_content.replace('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here', f'SUPABASE_SERVICE_ROLE_KEY={supabase_service_key}')
    
    if openai_api_key:
        env_content = env_content.replace('OPENAI_API_KEY=your-actual-api-key-here', f'OPENAI_API_KEY={openai_api_key}')
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("✓ .env file updated with your credentials")
    print()
    
    # Next steps
    print("Step 4: Set Up Database")
    print("-" * 70)
    print()
    print("Next, you need to set up the database schema in Supabase:")
    print()
    print("1. Go to your Supabase Dashboard")
    print("2. Click on 'SQL Editor' in the left sidebar")
    print("3. Click 'New Query'")
    print("4. Copy the contents of 'supabase_schema.sql' from this project")
    print("5. Paste into the SQL Editor")
    print("6. Click 'Run' to execute")
    print()
    
    response = input("Press Enter when you've completed the database setup...")
    
    # Test connection
    print()
    print("Step 5: Testing Connection")
    print("-" * 70)
    print()
    print("Running connection test...")
    print()
    
    # Run test script
    import subprocess
    result = subprocess.run(['python', 'test_supabase_connection.py'], capture_output=False)
    
    if result.returncode == 0:
        print()
        print("=" * 70)
        print("✓ SETUP COMPLETE!")
        print("=" * 70)
        print()
        print("Your Supabase integration is ready to use.")
        print()
        print("Next steps:")
        print("1. Run the app: python app.py")
        print("2. Upload a lure image")
        print("3. Check your Supabase dashboard to see the data!")
        print()
    else:
        print()
        print("=" * 70)
        print("⚠ Setup completed but connection test failed")
        print("=" * 70)
        print()
        print("Please check:")
        print("1. Your credentials are correct")
        print("2. You ran supabase_schema.sql in Supabase SQL Editor")
        print("3. Your Supabase project is active")
        print()
        print("See SUPABASE_TROUBLESHOOTING.md for more help")
        print()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nSetup cancelled by user.")
    except Exception as e:
        print(f"\n\n❌ Error during setup: {e}")
        print("See SUPABASE_TROUBLESHOOTING.md for help")

