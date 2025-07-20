import { DataTypes, Model, Sequelize } from 'sequelize';

export interface IVaultGuess {
  id: string;
  key: number;
  hour: string;
  vaultId: string;
  userId: string;
}

export class VaultGuess extends Model implements IVaultGuess {
  declare id: string;
  declare key: number;
  declare hour: string;
  declare vaultId: string;
  declare userId: string;
}

export function InitVaultGuessModel(sequelize: Sequelize) {
  const VaultGuessModel = VaultGuess.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      key: { type: DataTypes.INTEGER, allowNull: false },
      hour: { type: DataTypes.TEXT, allowNull: false },
      vaultId: { type: DataTypes.UUID, allowNull: false },
      userId: { type: DataTypes.UUID, allowNull: false },
    },
    {
      sequelize: sequelize,
      tableName: 'VaultGuesses',
      paranoid: true,
      indexes: [
        // This is used to check if the user has already submitted a guess for today for this vault
        {
          name: 'VaultGuesses_vaultId_userId_hour_unique',
          fields: ['vaultId', 'userId', 'hour'],
          unique: true,
        },
        // This is used to check if the key has already been submitted for this vault
        {
          name: 'VaultGuesses_vaultId_key_unique',
          fields: ['vaultId', 'key'],
          unique: true,
        },
      ],
    }
  );
  return VaultGuessModel;
}
