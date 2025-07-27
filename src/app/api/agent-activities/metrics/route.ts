import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { agentActivityLogger } from '@/lib/agent-activity-logger';
import { securityHeaders, auditLogger } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      auditLogger.log({ type: 'auth_failure', details: { route: 'agent-activities-metrics' } });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: securityHeaders });
    }

    const metrics = agentActivityLogger.getMetrics();

    return NextResponse.json({
      ...metrics,
      timestamp: new Date().toISOString(),
    }, { headers: securityHeaders });

  } catch (error) {
    console.error('Error fetching agent metrics:', error);
    auditLogger.log({
      type: 'api_error',
      details: { route: 'agent-activities-metrics', error: error instanceof Error ? error.message : 'Unknown error' }
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: securityHeaders });
  }
}