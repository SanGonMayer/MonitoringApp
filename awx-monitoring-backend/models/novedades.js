import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Novedad = sequelize.define('Novedad', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // Id del host, extraído del snapshot original
  host_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Nombre o identificador del host (renombrado de "host" a "host_name")
  host_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // Estado o status de la novedad
  status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Indica si el host está habilitado
  enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  // Fecha en la que se capturó el snapshot
  snapshot_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  // Id del inventario
  inventory_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Id de la filial actual
  filial_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Id de la filial anterior (si hubo cambio)
  old_filial_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  // Motivo o descripción de la novedad
  motivo: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  }
}, {
    tableName: 'Novedades',
    freezeTableName: true,
});

export default Novedad;
