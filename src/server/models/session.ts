import { DataTypes, Model, Sequelize } from 'sequelize';

export interface ISession {
  id: string;
  expires: Date;
  sessionToken: string;
  userId: string;
}

export class Session extends Model implements ISession {
  declare id: string;
  declare expires: Date;
  declare sessionToken: string;
  declare userId: string;
}

export function InitSessionModel(sequelize: Sequelize) {
  return Session.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      expires: { type: DataTypes.DATE, allowNull: false },
      sessionToken: {
        type: DataTypes.TEXT,
        unique: 'sessionToken',
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
      },
    },
    {
      underscored: true,
      sequelize: sequelize,
      tableName: 'sessions',
    }
  );
}
