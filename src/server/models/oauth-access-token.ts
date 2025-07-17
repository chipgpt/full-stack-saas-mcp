import { DataTypes, Model, Sequelize } from 'sequelize';
import { IUser, User } from './user';
import { IOAuthClient, OAuthClient } from './oauth-client';

export interface IOAuthAccessToken {
  id: string;
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  scope: string[];
  clientId: string;
  userId: string;

  client?: IOAuthClient | null;
  user?: IUser | null;
}

export class OAuthAccessToken extends Model implements IOAuthAccessToken {
  declare id: string;
  declare accessToken: string;
  declare accessTokenExpiresAt: Date;
  declare refreshToken: string;
  declare refreshTokenExpiresAt: Date;
  declare scope: string[];
  declare clientId: string;
  declare userId: string;

  declare client?: OAuthClient | null;
  declare user?: User | null;
}

export function InitOAuthAccessTokenModel(sequelize: Sequelize) {
  return OAuthAccessToken.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      accessToken: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      accessTokenExpiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      refreshToken: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      refreshTokenExpiresAt: {
        type: DataTypes.DATE,
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
        allowNull: false,
      },
    },
    {
      sequelize: sequelize,
      tableName: 'OAuthAccessTokens',
    }
  );
}
