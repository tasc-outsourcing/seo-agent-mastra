# Clerk Authentication Setup

## Getting Started with Clerk

### 1. Create a Clerk Account
1. Go to [https://clerk.com](https://clerk.com)
2. Sign up for a free account
3. Create a new application

### 2. Get Your API Keys
1. Go to your Clerk Dashboard
2. Navigate to "API Keys" in the sidebar
3. Copy your **Publishable Key** and **Secret Key**

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory with the following variables:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# OpenAI API Key for the weather agent
OPENAI_API_KEY=your_openai_api_key_here

# Database URL for Mastra
DATABASE_URL=file:mastra.db

# Clerk Configuration
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### 4. Configure Clerk Application
1. In your Clerk Dashboard, go to "User & Authentication"
2. Configure your sign-in and sign-up methods
3. Set up your application URLs:
   - **Home URL**: `http://localhost:3000`
   - **Sign-in URL**: `http://localhost:3000/sign-in`
   - **Sign-up URL**: `http://localhost:3000/sign-up`

### 5. Run the Application
```bash
npm run dev
```

## Features Included

- ✅ **Top Navigation Bar** with authentication status
- ✅ **Sign In Page** at `/sign-in`
- ✅ **Sign Up Page** at `/sign-up`
- ✅ **User Button** with logout functionality
- ✅ **Protected Routes** - redirects to sign-in if not authenticated
- ✅ **Modal Authentication** - sign in/up without page navigation

## Authentication Flow

1. **Unauthenticated users** are redirected to `/sign-in`
2. **Sign up** creates a new account
3. **Sign in** authenticates existing users
4. **User button** in top nav shows user info and logout option
5. **Protected routes** require authentication

## Customization

You can customize the Clerk appearance and behavior by modifying:
- `src/components/top-nav.tsx` - Navigation bar styling
- `src/app/sign-in/[[...sign-in]]/page.tsx` - Sign-in page
- `src/app/sign-up/[[...sign-up]]/page.tsx` - Sign-up page
- `src/middleware.ts` - Route protection rules 