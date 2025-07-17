import { DataTypes, Model, Sequelize } from 'sequelize';

export enum OAuthClientGrant {
  AUTHORIZATION_CODE = 'authorization_code',
  REFRESH_TOKEN = 'refresh_token',
}

export enum OAuthClientScope {
  READ = 'read',
  WRITE = 'write',
}

export interface IOAuthClient {
  id: string;
  name: string;
  uri: string;
  secret: string;
  redirectUris: string[];
  grants: OAuthClientGrant[];
  scope: OAuthClientScope[];
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
  declare grants: OAuthClientGrant[];
  declare scope: OAuthClientScope[];
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
        type: DataTypes.UUID,
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
