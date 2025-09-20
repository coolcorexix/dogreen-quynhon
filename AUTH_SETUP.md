# Authentication Setup with Supabase

This project now includes a complete authentication system using Supabase with support for both email/password and phone number OTP authentication.

## Features Implemented

✅ **Email/Password Authentication**
- User registration with email and password
- User login with email and password
- Password visibility toggle
- Password confirmation validation

✅ **Phone Number OTP Authentication**
- Phone number registration/login
- SMS OTP verification
- Automatic OTP sending and verification

✅ **User Interface**
- Modern, responsive authentication modals
- Vietnamese language support
- Toggle between login and signup modes
- User profile dropdown when logged in
- Sign out functionality

✅ **State Management**
- React Context for authentication state
- Persistent sessions
- Loading states and error handling

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization and fill in project details
5. Wait for the project to be created

### 2. Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy your **Project URL** and **anon public key**

### 3. Configure Environment Variables

1. Copy `env.example` to `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Update `.env.local` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 4. Configure Supabase Authentication

In your Supabase dashboard:

1. Go to **Authentication** > **Settings**
2. Enable **Email** provider
3. Enable **Phone** provider
4. Configure your site URL (e.g., `http://localhost:5173` for development)

### 5. Install Dependencies

The Supabase client has been added to `package.json`. Run:
```bash
npm install
```

### 6. Start the Development Server

```bash
npm run dev
```

## Usage

### Authentication Flow

1. **Login/Signup**: Click "đăng nhập" or "đăng ký" buttons on the homepage
2. **Email Auth**: Enter email and password
3. **Phone Auth**: Enter phone number, receive OTP, enter OTP
4. **User Profile**: When logged in, click your profile to access sign out

### Components Available

- `AuthModal`: Main authentication modal
- `LoginForm`: Login form with email/phone toggle
- `SignupForm`: Registration form with email/phone toggle
- `UserProfile`: User profile dropdown
- `ProtectedRoute`: Wrapper for protected pages
- `AuthProvider`: Context provider for authentication state

### Customization

You can customize the authentication flow by:

1. **Styling**: Modify the Tailwind classes in the auth components
2. **Language**: Change text content in the forms
3. **Validation**: Add custom validation rules
4. **Redirects**: Add redirect logic after successful authentication

## File Structure

```
src/
├── components/
│   └── Auth/
│       ├── AuthModal.tsx
│       ├── LoginForm.tsx
│       ├── SignupForm.tsx
│       ├── UserProfile.tsx
│       └── ProtectedRoute.tsx
├── contexts/
│   └── AuthContext.tsx
├── lib/
│   └── supabase.ts
└── pages/
    └── HomePage2.tsx (updated with auth integration)
```

## Security Notes

- Never commit your `.env.local` file
- Use HTTPS in production
- Configure proper CORS settings in Supabase
- Set up Row Level Security (RLS) policies for your database tables

## Troubleshooting

### Common Issues

1. **"Invalid API key"**: Check your environment variables
2. **"Invalid phone number"**: Ensure phone number includes country code (e.g., +84)
3. **OTP not received**: Check Supabase phone provider configuration
4. **CORS errors**: Configure allowed origins in Supabase settings

### Debug Mode

To debug authentication issues, check the browser console for Supabase logs and ensure your environment variables are properly loaded.
