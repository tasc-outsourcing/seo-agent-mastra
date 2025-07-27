import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { agentActivityLogger } from '@/lib/agent-activity-logger';
import { securityHeaders, auditLogger } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      auditLogger.log({ type: 'auth_failure', details: { route: 'agent-activities' } });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: securityHeaders });
    }

    const { searchParams } = new URL(request.url);
    const agentName = searchParams.get('agent');
    const limit = parseInt(searchParams.get('limit') || '50');

    let activities;
    if (agentName) {
      activities = agentActivityLogger.getActivitiesByAgent(agentName).slice(0, limit);
    } else {
      const metrics = agentActivityLogger.getMetrics();
      activities = metrics.recentActivities.slice(0, limit);
    }

    return NextResponse.json({
      activities,
      timestamp: new Date().toISOString(),
    }, { headers: securityHeaders });

  } catch (error) {
    console.error('Error fetching agent activities:', error);
    auditLogger.log({
      type: 'api_error',
      details: { route: 'agent-activities', error: error instanceof Error ? error.message : 'Unknown error' }
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: securityHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      auditLogger.log({ type: 'auth_failure', details: { route: 'agent-activities-post' } });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: securityHeaders });
    }

    const body = await request.json();
    const { action, agentName, activity, activityId, updates } = body;

    let result;
    switch (action) {
      case 'start':
        result = await agentActivityLogger.startActivity(
          agentName,
          activity,
          body.input,
          body.metadata
        );
        break;
      
      case 'update':
        await agentActivityLogger.updateActivity(activityId, updates);
        result = { success: true };
        break;
      
      case 'complete':
        await agentActivityLogger.completeActivity(
          activityId,
          body.output,
          body.error
        );
        result = { success: true };
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers: securityHeaders });
    }

    return NextResponse.json(result, { headers: securityHeaders });

  } catch (error) {
    console.error('Error managing agent activity:', error);
    auditLogger.log({
      type: 'api_error',
      details: { route: 'agent-activities-post', error: error instanceof Error ? error.message : 'Unknown error' }
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: securityHeaders });
  }
}