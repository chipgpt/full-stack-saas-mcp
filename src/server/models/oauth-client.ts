import { DataTypes, Model, Sequelize } from 'sequelize';

export enum OAuthClientGrantEnum {
  AuthorizationCode = 'authorization_code',
  RefreshToken = 'refresh_token',
}

export enum OAuthClientScopeEnum {
  Read = 'read',
  Write = 'write',
}

export interface IOAuthClient {
  id: string;
  name: string;
  uri: string;
  secret: string;
  redirectUris: string[];
  grants: OAuthClientGrantEnum[];
  scope: OAuthClientScopeEnum[];
  accessTokenLifetime: number;
  refreshTokenLifetime: number;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class OAuthClient extends Model implements IOAuthClient {
  declare id: string;
  declare name: string;
  declare uri: string;
  declare secret: string;
  declare redirectUris: string[];
  declare grants: OAuthClientGrantEnum[];
  declare scope: OAuthClientScopeEnum[];
  declare accessTokenLifetime: number;
  declare refreshTokenLifetime: number;
  declare userId: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | null;
}

export function InitOAuthClientModel(sequelize: Sequelize) {
  return OAuthClient.init(
    {
      id: {
        type: DataTypes.TEXT,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '',
      },
      uri: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '',
      },
      secret: {
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      redirectUris: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
      },
      grants: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
      },
      scope: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
      },
      accessTokenLifetime: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      refreshTokenLifetime: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize: sequelize,
      tableName: 'OAuthClients',
      paranoid: true,
    }
  );
}
