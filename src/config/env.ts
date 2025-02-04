export const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.NEXT_PUBLIC_CLAUDE_API_KEY

if (!CLAUDE_API_KEY) {
  console.error('CLAUDE_API_KEY is not set in environment variables')
} else {
  console.log('CLAUDE_API_KEY is configured:', CLAUDE_API_KEY.substring(0, 10) + '...')
} 