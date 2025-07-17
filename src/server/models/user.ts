import { DataTypes, Model, Sequelize } from 'sequelize';

export interface IUserProfile {
  context: string;
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  emailVerified: Date;
  image: string;
  profile: IUserProfile;
}

export class User extends Model implements IUser {
  declare id: string;
  declare name: string;
  declare email: string;
  declare emailVerified: Date;
  declare image: string;
  declare profile: IUserProfile;
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
    },
    {
      underscored: true,
      sequelize: sequelize,
      tableName: 'users',
      paranoid: true,
    }
  );
}
