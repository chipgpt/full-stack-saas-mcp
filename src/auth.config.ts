import { NextAuthConfig } from 'next-auth';
import Cognito from 'next-auth/providers/cognito';
import { Resource } from 'sst';
import { Sequelize } from 'sequelize';
import { CONFIG } from './server/config';
import pg from 'pg';
import { InitUserModel } from './server/models/user';
import { InitAccountModel } from './server/models/account';
import SequelizeAdapter from './lib/@auth/sequelize-adapter';
import { InitSessionModel } from './server/models/session';
import { InitVerificationTokenModel } from './server/models/verification-token';
import { sendMailgunEmail } from './server/utils/mailgun';

export const nextAuthConfig: NextAuthConfig = {
  callbacks: {
    // We have to call this to get the full session object
    session: async ({ session }) => {
      return session;
    },
    // authorized: async ({ request, auth }) => {
    //   console.log('\n\nAUTHORIZED', request, auth);
    //   // Logged in users are authenticated, otherwise redirect to login page
    //   return !!auth;
    // },
    // signIn(args) {
    //   console.log('\n\n\nSIGNIN', args);
    //   return true;
    // },
    // redirect(args) {
    //   console.log('\n\n\nREDIRECT', args);
    //   return `${args.baseUrl}/dashboard`;
    // },
    // async jwt(args) {
    //   console.log('\n\nJWT', args);
    //   return args;
    // },
  },
  events: {
    // Send welcome email to new users
    createUser: async ({ user }) => {
      if (user.email) {
        sendMailgunEmail(
          user.email,
          'Welcome to ChipGPT',
          'Welcome to ChipGPT',
          'Welcome to ChipGPT'
        );
      }
    },
  },
  providers: [
    Cognito({
      clientId: Resource.MyUserPoolClient.id,
      clientSecret: Resource.MyUserPoolClient.secret,
      issuer: `https://cognito-idp.${CONFIG.aws.region}.amazonaws.com/${Resource.MyUserPool.id}`,
    }),
  ],
};

export const getNextAuthConfig = async (): Promise<NextAuthConfig> => {
  const sequelize = new Sequelize({
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
  });
  return {
    ...nextAuthConfig,
    adapter: SequelizeAdapter(sequelize, {
      models: {
        User: InitUserModel(sequelize),
        // @ts-expect-error
        Account: InitAccountModel(sequelize),
        Session: InitSessionModel(sequelize),
        VerificationToken: InitVerificationTokenModel(sequelize),
      },
      synchronize: true,
      associations: (User, Account, Session) => {
        Account.belongsTo(User, { onDelete: 'cascade', foreignKey: 'userId', as: 'user' });
        Session.belongsTo(User, { onDelete: 'cascade', foreignKey: 'userId', as: 'user' });
      },
    }),
    debug: true,
  };
};
