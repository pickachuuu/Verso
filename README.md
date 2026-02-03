# ReviseA - AI-Powered Study Assistant

A modern, AI-powered study assistant that helps you create and manage notes, generate flashcards, and track your learning progress.

## Features

### 📝 Note Management
- Create, edit, and organize study notes
- Rich text editing with markdown support
- Tag-based organization system
- Real-time collaboration

### 🎯 AI-Powered Flashcard Generation
- Generate flashcards from your notes using Google's Gemini AI
- Multiple difficulty levels (Easy, Medium, Hard)
- Preview mode to review flashcards before saving
- Support for generating from selected text sections
- Configurable flashcard count (1-50 cards)
- **Automatic saving to Supabase database**
- **Flashcard set management with progress tracking**
- **Study session support with spaced repetition**

### 📚 Flashcard Study System
- Interactive flashcard review sessions
- Spaced repetition algorithm
- Progress tracking and statistics
- Multiple study modes

## Setup

### Prerequisites
- Node.js 18+ 
- Supabase account
- Google Gemini API key

### Environment Variables
Create a `.env.local` file with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/revisea.git
cd revisea
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
# Run the database schema
psql -h your_supabase_host -U postgres -d postgres -f database_schema.sql

# Run the RLS policies (IMPORTANT: Required for flashcard saving to work)
psql -h your_supabase_host -U postgres -d postgres -f rls_policies.sql
```

4. Start the development server:
```bash
npm run dev
```

## Flashcard Generation

The flashcard generation feature uses Google's Gemini AI to create high-quality flashcards from your notes. Here's how to use it:

### Basic Usage
1. Navigate to your notes
2. Click the "Generate Flashcards" button on any note
3. Configure your preferences:
   - Number of flashcards (1-50)
   - Difficulty level (Easy, Medium, Hard, or All levels)
   - Use selected section only (if you've highlighted text)
   - Preview mode (to review before saving)
4. Click "Generate Flashcards"

### Features
- **Smart Content Selection**: Choose between using the entire note or just selected text
- **Difficulty Control**: Generate flashcards at different complexity levels
- **Preview Mode**: Review generated flashcards before saving them
- **Settings Persistence**: Your preferences are saved for future use
- **Error Handling**: Clear error messages for common issues
- **Database Integration**: Generated flashcards are automatically saved to your Supabase database
- **Flashcard Sets**: Each generation creates a new flashcard set linked to your note
- **Progress Tracking**: Track your study progress with built-in spaced repetition

### API Configuration
Make sure you have a valid Google Gemini API key set in your environment variables. The system will automatically validate the API key and provide helpful error messages if it's missing or invalid.

## Troubleshooting

### 403 Errors When Saving Flashcards
If you encounter 403 errors when trying to save flashcards, make sure you have run the RLS policies:

```bash
psql -h your_supabase_host -U postgres -d postgres -f rls_policies.sql
```

The RLS policies are required for the flashcard saving functionality to work properly.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.