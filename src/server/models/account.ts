import { DataTypes, Model, Sequelize } from 'sequelize';
import { User } from './user';

export interface IAccount {
  id: string;
  type: string;
  provider: string;
  scope: string;
  userId: string;
  providerAccountId: string;
  refresh_token: string;
  access_token: string;
  expires_at: number;
  token_type: string;
  id_token: string;
  session_state: string;

  user?: User | null;
}

export class Account extends Model implements IAccount {
  declare id: string;
  declare type: string;
  declare provider: string;
  declare scope: string;
  declare userId: string;
  declare providerAccountId: string;
  declare refresh_token: string;
  declare access_token: string;
  declare expires_at: number;
  declare token_type: string;
  declare id_token: string;
  declare session_state: string;

  declare user?: User | null;
}

export function InitAccountModel(sequelize: Sequelize) {
  return Account.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      type: { type: DataTypes.STRING, allowNull: false },
      provider: { type: DataTypes.STRING, allowNull: false },
      scope: { type: DataTypes.STRING },
      userId: { type: DataTypes.UUID },
      providerAccountId: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: 'provider_account_id_unique',
      },
      refresh_token: {
        type: DataTypes.TEXT,
      },
      access_token: {
        type: DataTypes.TEXT,
      },
      expires_at: {
        type: DataTypes.INTEGER,
      },
      token_type: {
        type: DataTypes.TEXT,
      },
      id_token: {
        type: DataTypes.TEXT,
      },
      session_state: {
        type: DataTypes.TEXT,
      },
    },
    {
      underscored: true,
      timestamps: false,
      sequelize: sequelize,
      tableName: 'accounts',
      paranoid: true,
    }
  );
}
