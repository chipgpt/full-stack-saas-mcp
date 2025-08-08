import { DataTypes, Model, Sequelize } from 'sequelize';

export interface IUserProfile {
  context: string;
}

export interface IUser {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  profile: IUserProfile;
  plan: string | null;
  stripeCustomerId: string | null;
}

export class User extends Model implements IUser {
  declare id: string;
  declare name: string | null;
  declare email: string | null;
  declare emailVerified: Date | null;
  declare image: string | null;
  declare profile: IUserProfile;
  declare plan: string | null;
  declare stripeCustomerId: string | null;
}

export function InitUserModel(sequelize: Sequelize) {
  return User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING },
      email: { type: DataTypes.STRING, unique: 'email' },
      emailVerified: { type: DataTypes.DATE },
      image: { type: DataTypes.TEXT },
      profile: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: { context: '' },
      },
      plan: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      stripeCustomerId: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      underscored: true,
      sequelize: sequelize,
      tableName: 'users',
      paranoid: true,
    }
  );
}
