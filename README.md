# APIfy2 - Advanced API Testing Platform

A modern, feature-rich API testing platform built with Next.js, Supabase, and AI integration.

## 🚀 Features

- **AI-Powered Test Generation**: Generate API tests using Gemini and Hugging Face models
- **Manual API Testing**: Comprehensive manual testing with various authentication methods
- **OpenAPI/Swagger Import**: Import and test APIs from OpenAPI specifications
- **Test History**: Track and analyze all your API tests with detailed statistics
- **Favorites**: Save frequently used API tests for quick access
- **CORS Proxy**: Built-in CORS bypass functionality
- **Real-time Analysis**: AI-powered response analysis and insights
- **Dark/Light Theme**: Modern UI with theme support

## 🛠 Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **UI**: Tailwind CSS, Radix UI, Lucide Icons
- **AI**: Google Gemini, Hugging Face Transformers
- **Deployment**: Vercel

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/Jarlyy/APIfy2.git
cd APIfy2
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in your Supabase and AI provider credentials.

4. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

## 🌐 Deployment on Vercel

### Prerequisites
- Vercel account
- Supabase project
- AI provider API keys (Gemini, Hugging Face)

### Deploy Steps

1. **Connect to Vercel**:
   - Import your GitHub repository to Vercel
   - Or use Vercel CLI: `vercel --prod`

2. **Environment Variables**:
   Set these in Vercel dashboard or via CLI:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_key
   HUGGINGFACE_API_KEY=your_huggingface_key
   ```

3. **Database Setup**:
   - Run the SQL schema from `supabase/schema.sql` in your Supabase project
   - Enable Row Level Security (RLS) policies

4. **Deploy**:
   - Vercel will automatically build and deploy
   - Your app will be available at `https://your-app.vercel.app`

### Vercel Configuration

The project includes optimized `vercel.json` configuration:
- API routes with 30s timeout
- CORS headers for API endpoints
- Optimized build settings

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Run the schema from `supabase/schema.sql`
3. Configure authentication providers if needed
4. Set up RLS policies for security

### AI Providers
- **Gemini**: Get API key from Google AI Studio
- **Hugging Face**: Get API key from Hugging Face Hub

## 📱 Usage

1. **Manual Testing**: Create and execute API tests with various auth methods
2. **AI Generation**: Generate test suites using AI for any API service
3. **OpenAPI Import**: Import Swagger/OpenAPI specs and test endpoints
4. **History & Analytics**: View test history and performance analytics
5. **Favorites**: Save commonly used tests for quick access

## 🔒 Security

- Environment variables for sensitive data
- Row Level Security (RLS) in Supabase
- CORS protection and security headers
- Input validation and sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in `/docs`
- Review the setup guide in `SETUP.md`
