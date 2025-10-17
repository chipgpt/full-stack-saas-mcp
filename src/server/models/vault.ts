import { DataTypes, Model, Sequelize } from 'sequelize';

export interface IVault {
  id: string;
  name: string;
  /** The minimum value of the vault combination */
  min: number;
  /** The maximum value of the vault combination */
  max: number;
  /** The combination of the vault */
  key: number;
  /** The reward value (USD) of the vault */
  value: number;
  /** The date and time the vault was opened */
  openedAt: Date | null;
  /** The ID of the winning vault guess */
  winningVaultGuessId: string | null;
}

export class Vault extends Model implements IVault {
  declare id: string;
  declare name: string;
  declare min: number;
  declare max: number;
  declare key: number;
  declare value: number;
  declare openedAt: Date | null;
  declare winningVaultGuessId: string | null;
}

export function InitVaultModel(sequelize: Sequelize) {
  return Vault.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING, allowNull: false },
      min: { type: DataTypes.INTEGER, allowNull: false },
      max: { type: DataTypes.INTEGER, allowNull: false },
      key: { type: DataTypes.INTEGER, allowNull: false },
      value: { type: DataTypes.INTEGER, allowNull: false },
      openedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
      winningVaultGuessId: {
        type: DataTypes.UUID,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize: sequelize,
      tableName: 'Vaults',
      paranoid: true,
    }
  );
}
