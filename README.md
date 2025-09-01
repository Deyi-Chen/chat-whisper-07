# ChatRoom - Real-time Web Chat Application

A modern, responsive real-time chat application built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

### 🚀 Core Features
- **Real-time messaging** - Instant message delivery using Supabase real-time subscriptions
- **Text + Emoji support** - Rich text input with emoji picker
- **User authentication** - Email/password registration or guest access
- **Multiple chat rooms** - Create and join different rooms
- **User presence** - See who's online in each room
- **Message history** - Persistent chat logs with pagination
- **Responsive design** - Works seamlessly on mobile and desktop

### 🔒 Security & Moderation
- **Rate limiting** - 1 message per 2 seconds per user
- **Message length limits** - Maximum 2000 characters
- **Basic profanity filter** - Content moderation
- **Row Level Security** - Database-level access control
- **Input validation** - Secure data handling

### 🎨 User Experience
- **Guest mode** - Quick access without registration
- **Auto-scroll** - Smart message list navigation
- **Loading states** - Skeleton loaders and progress indicators
- **Error handling** - User-friendly error messages
- **Keyboard shortcuts** - Enter to send, Shift+Enter for new line

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **React Router** for navigation
- **React Query** for data management
- **emoji-picker-react** for emoji support

### Backend & Database
- **Supabase** for backend services
- **PostgreSQL** database with real-time subscriptions
- **Row Level Security (RLS)** for data protection
- **Auto-generated TypeScript types**

### Development Tools
- **Vite** for fast development
- **ESLint** for code quality
- **TypeScript** for type safety

## Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- A Supabase account

### 1. Clone and Install
```bash
git clone <repository-url>
cd chatroom
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

### 3. Database Setup
The database schema and RLS policies are already configured. If you need to reset:

1. Go to your Supabase dashboard → SQL Editor
2. Run the migration scripts from `supabase/migrations/`
3. Or use the Supabase CLI:
```bash
npx supabase db reset
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) to view the application.

### 5. Build for Production
```bash
npm run build
npm run preview
```

## Usage Guide

### Getting Started
1. **Visit the app** - Navigate to the homepage
2. **Sign up or continue as guest** - Choose your preferred authentication method
3. **Join the Lobby** - Start chatting in the default room
4. **Create rooms** - Use the "+" button to create new chat rooms
5. **Switch rooms** - Click on room names to join different conversations

### Chat Features
- **Send messages** - Type and press Enter
- **Add emojis** - Click the emoji button or type directly
- **Multi-line messages** - Use Shift+Enter for new lines
- **View online users** - Check who's currently active
- **Message history** - Scroll up to load older messages

### Mobile Usage
- **Responsive design** - Optimized for all screen sizes
- **Swipe navigation** - Easy room switching on mobile
- **Touch-friendly** - Large tap targets and smooth interactions

## Database Schema

### Tables
- **profiles** - User profile information
- **rooms** - Chat room definitions
- **messages** - Chat message content
- **user_presence** - Online user tracking

### Key Features
- **Real-time subscriptions** enabled on all tables
- **Row Level Security** for data protection
- **Automatic timestamps** with triggers
- **Foreign key relationships** for data integrity

## Security Considerations

### Authentication
- **Supabase Auth** with email verification
- **Guest accounts** for quick access
- **Session management** with automatic token refresh

### Data Protection
- **RLS policies** restrict data access
- **Input validation** prevents XSS attacks
- **Rate limiting** prevents spam
- **Content filtering** for appropriate communication

### Production Setup
1. **Configure email settings** in Supabase
2. **Set up proper CORS** for your domain
3. **Review RLS policies** for your use case
4. **Enable email confirmation** for production
5. **Configure rate limiting** as needed

## Deployment

### Supabase Deployment
Your Supabase backend is already deployed and configured.

### Frontend Deployment
Deploy to platforms like:
- **Vercel** - `vercel --prod`
- **Netlify** - Connect your git repository
- **Cloudflare Pages** - Direct git integration

### Environment Variables
Ensure production environment variables are set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PROJECT_ID`

## Troubleshooting

### Common Issues

**Authentication Problems**
- Check Supabase URL configuration in auth settings
- Verify redirect URLs in Supabase dashboard
- Ensure email confirmation is properly configured

**Real-time Not Working**
- Verify real-time is enabled in Supabase
- Check RLS policies allow proper access
- Confirm WebSocket connections aren't blocked

**Performance Issues**
- Check message pagination is working
- Monitor network requests in browser dev tools

## License

This project is licensed under the MIT License.