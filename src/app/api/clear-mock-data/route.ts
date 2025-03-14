import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Run the following code in your browser console to clear mock data:',
    code: 'localStorage.removeItem("dsground_mock_data"); localStorage.removeItem("zustand-platforms"); localStorage.removeItem("zustand-brands")',
  });
} 