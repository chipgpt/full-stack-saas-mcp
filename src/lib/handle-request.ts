import { getReusableSequelize } from '@/server/models';
import { OAuthError } from '@node-oauth/oauth2-server';
import { NextRequest, NextResponse } from 'next/server';
import { Sequelize, ValidationError } from 'sequelize';

// Track pending requests and don't close db connection until it gets back to 0
let pending = 0;

export function handleRequest(
  handler: (req: NextRequest, sequelize: Sequelize) => Promise<NextResponse>
) {
  return async function requestHandler(req: NextRequest) {
    pending++;

    let sequelize;
    try {
      sequelize = await getReusableSequelize(pending === 1);

      try {
        return await handler(req, sequelize);
      } catch (e) {
        if (e instanceof OAuthError) {
          return NextResponse.json({ error: e.message }, { status: e.code || 500 });
        } else if (e instanceof ValidationError) {
          return NextResponse.json(
            { error: e.errors.map(error => error.message).join(', ') },
            { status: 400 }
          );
        } else {
          console.error(e);
          return NextResponse.json({ error: 'An unexpected error has occurred' }, { status: 500 });
        }
      }
    } catch (e) {
      console.error('Sequelize failed to connect', e);
      return NextResponse.json({ error: 'An unexpected error has occurred' }, { status: 500 });
    } finally {
      pending--;
      if (pending === 0 && sequelize) {
        // close any opened connections during the invocation
        // this will wait for any in-progress queries to finish before closing the connections
        await sequelize.connectionManager.close();
      }
    }
  };
}
