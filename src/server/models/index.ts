import pg from 'pg';
import { Options, Sequelize } from 'sequelize';
import { once } from 'lodash';
import { CONFIG } from '../config';
import { InitAccountModel } from './account';
import { InitUserModel } from './user';
import { InitOAuthClientModel } from './oauth-client';
import { InitOAuthAccessTokenModel } from './oauth-access-token';
import { InitOAuthAuthorizationCodeModel } from './oauth-authorization-code';
import { InitSessionModel } from './session';
import { InitVerificationTokenModel } from './verification-token';
import { InitVaultModel } from './vault';
import { InitVaultGuessModel } from './vault-guess';

export const getSequelizeConnection = once((lambda: boolean) => {
  const connectionOptions: Options = {
    logging: false,
    host: CONFIG.database.url.hostname,
    port: Number(CONFIG.database.url.port),
    database: CONFIG.database.url.pathname.slice(1),
    username: CONFIG.database.url.username,
    password: decodeURIComponent(CONFIG.database.url.password),
    dialect: 'postgres',
    ssl: CONFIG.database.ssl,
    dialectModule: pg,
    dialectOptions: CONFIG.database.ssl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
  };

  const sequelize = new Sequelize({
    ...connectionOptions,
    pool: lambda
      ? {
          /*
           * Lambda functions process one request at a time but your code may issue multiple queries
           * concurrently. Be wary that `sequelize` has methods that issue 2 queries concurrently
           * (e.g. `Model.findAndCountAll()`). Using a value higher than 1 allows concurrent queries to
           * be executed in parallel rather than serialized. Careful with executing too many queries in
           * parallel per Lambda function execution since that can bring down your database with an
           * excessive number of connections.
           *
           * Ideally you want to choose a `max` number where this holds true:
           * max * EXPECTED_MAX_CONCURRENT_LAMBDA_INVOCATIONS < MAX_ALLOWED_DATABASE_CONNECTIONS * 0.8
           */
          max: 2,
          /*
           * Set this value to 0 so connection pool eviction logic eventually cleans up all connections
           * in the event of a Lambda function timeout.
           */
          min: 0,
          /*
           * Set this value to 0 so connections are eligible for cleanup immediately after they're
           * returned to the pool.
           */
          idle: 0,
          // Choose a small enough value that fails fast if a connection takes too long to be established.
          acquire: 3000,
          /*
           * Ensures the connection pool attempts to be cleaned up automatically on the next Lambda
           * function invocation, if the previous invocation timed out.
           */
          evict: 20000,
        }
      : undefined,
  });

  const Account = InitAccountModel(sequelize);
  const User = InitUserModel(sequelize);
  const OAuthClient = InitOAuthClientModel(sequelize);
  const OAuthAccessToken = InitOAuthAccessTokenModel(sequelize);
  const OAuthAuthorizationCode = InitOAuthAuthorizationCodeModel(sequelize);
  const Session = InitSessionModel(sequelize);
  const Vault = InitVaultModel(sequelize);
  const VaultGuess = InitVaultGuessModel(sequelize);

  User.hasMany(Account, { foreignKey: 'userId', as: 'accounts' });
  Account.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  User.hasMany(OAuthClient, { foreignKey: 'userId', as: 'clients' });
  OAuthClient.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  User.hasMany(OAuthAccessToken, { foreignKey: 'userId', as: 'accessTokens' });
  OAuthAccessToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  User.hasMany(OAuthAuthorizationCode, { foreignKey: 'userId', as: 'authorizationCodes' });
  OAuthAuthorizationCode.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  OAuthClient.hasMany(OAuthAccessToken, { foreignKey: 'clientId', as: 'accessTokens' });
  OAuthAccessToken.belongsTo(OAuthClient, { foreignKey: 'clientId', as: 'client' });

  OAuthClient.hasMany(OAuthAuthorizationCode, { foreignKey: 'clientId', as: 'authorizationCodes' });
  OAuthAuthorizationCode.belongsTo(OAuthClient, { foreignKey: 'clientId', as: 'client' });

  User.hasMany(Session, { foreignKey: 'userId', as: 'sessions' });
  Session.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  Vault.hasMany(VaultGuess, { foreignKey: 'vaultId', as: 'valueGuesses' });
  VaultGuess.belongsTo(Vault, { foreignKey: 'vaultId', as: 'vault' });

  InitVerificationTokenModel(sequelize);

  return sequelize;
});

// How to use Sequelize with AWS Lambda Functions:
// https://sequelize.org/docs/v6/other-topics/aws-lambda

let reusableSequelize: Sequelize | null = null;

export async function getReusableSequelize(reinit: boolean) {
  // re-use the sequelize instance across invocations to improve performance
  if (!reusableSequelize) {
    const sequelize = getSequelizeConnection(true);
    reusableSequelize = sequelize;

    await sequelize.sync({ alter: { drop: false } });
  } else if (reinit) {
    // restart connection pool to ensure connections are not re-used across invocations
    reusableSequelize.connectionManager.initPools();

    // restore `getConnection()` if it has been overwritten by `close()`
    if (reusableSequelize.connectionManager.hasOwnProperty('getConnection')) {
      // @ts-ignore
      delete reusableSequelize.connectionManager.getConnection;
    }
  }

  return reusableSequelize;
}
