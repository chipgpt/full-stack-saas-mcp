import { DataTypes, Model, Sequelize } from 'sequelize';

export interface IVerificationToken {
  token: string;
  identifier: string;
  expires: Date;
}

export class VerificationToken extends Model implements IVerificationToken {
  declare token: string;
  declare identifier: string;
  declare expires: Date;
}

export function InitVerificationTokenModel(sequelize: Sequelize) {
  return VerificationToken.init(
    {
      token: { type: DataTypes.TEXT, primaryKey: true },
      identifier: { type: DataTypes.TEXT, allowNull: false },
      expires: { type: DataTypes.DATE, allowNull: false },
    },
    {
      underscored: true,
      sequelize: sequelize,
      tableName: 'verification_tokens',
    }
  );
}
