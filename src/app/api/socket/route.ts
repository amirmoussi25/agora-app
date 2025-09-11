import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Cette route est utilisée par le client pour établir la connexion WebSocket
  // La logique Socket.IO sera gérée par le middleware
  return NextResponse.json({ status: 'Socket.IO ready' });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ status: 'Socket.IO ready' });
}