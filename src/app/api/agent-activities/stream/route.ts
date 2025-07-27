import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { agentActivityLogger } from '@/lib/agent-activity-logger';
import { auditLogger } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      auditLogger.log({ type: 'auth_failure', details: { route: 'agent-activities-stream' } });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const sseData = `data: ${JSON.stringify({
          type: 'connection',
          message: 'Connected to agent activity stream',
          timestamp: new Date().toISOString()
        })}\n\n`;
        controller.enqueue(encoder.encode(sseData));

        // Register callback for activity updates
        const callback = (activity: any) => {
          try {
            const sseData = `data: ${JSON.stringify(activity)}\n\n`;
            controller.enqueue(encoder.encode(sseData));
          } catch (error) {
            console.error('Error sending SSE data:', error);
          }
        };

        agentActivityLogger.onActivity(callback);

        // Keep-alive ping every 30 seconds
        const keepAlive = setInterval(() => {
          try {
            const pingData = `data: ${JSON.stringify({
              type: 'ping',
              timestamp: new Date().toISOString()
            })}\n\n`;
            controller.enqueue(encoder.encode(pingData));
          } catch (error) {
            console.error('Error sending keep-alive ping:', error);
            clearInterval(keepAlive);
          }
        }, 30000);

        // Cleanup on connection close
        const cleanup = () => {
          clearInterval(keepAlive);
          // Note: In a production system, you'd want to remove the callback
          // from the activity logger to prevent memory leaks
        };

        // Handle client disconnect
        request.signal.addEventListener('abort', cleanup);
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Content-Type-Options': 'nosniff',
      }
    });

  } catch (error) {
    console.error('Error setting up agent activity stream:', error);
    auditLogger.log({
      type: 'api_error',
      details: { route: 'agent-activities-stream', error: error instanceof Error ? error.message : 'Unknown error' }
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}