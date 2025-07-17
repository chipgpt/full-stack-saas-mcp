import { DataTypes, Model, Sequelize } from 'sequelize';
import { IUser, User } from './user';
import { IOAuthClient, OAuthClient } from './oauth-client';

export interface IOAuthAuthorizationCode {
  id: string;
  authorizationCode: string;
  expiresAt: Date;
  redirectUri: string;
  scope: string[];
  clientId: string;
  userId: string | null;
  codeChallenge: string | null;
  codeChallengeMethod: string | null;

  client?: IOAuthClient | null;
  user?: IUser | null;
}

export class OAuthAuthorizationCode extends Model implements IOAuthAuthorizationCode {
  declare id: string;
  declare authorizationCode: string;
  declare expiresAt: Date;
  declare redirectUri: string;
  declare scope: string[];
  declare clientId: string;
  declare userId: string | null;
  declare codeChallenge: string | null;
  declare codeChallengeMethod: string | null;
  declare client?: OAuthClient | null;
  declare user?: User | null;
}

export function InitOAuthAuthorizationCodeModel(sequelize: Sequelize) {
  return OAuthAuthorizationCode.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      authorizationCode: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      redirectUri: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      scope: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
      },
      clientId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      codeChallenge: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      codeChallengeMethod: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize: sequelize,
      tableName: 'OAuthAuthorizationCodes',
    }
  );
}
