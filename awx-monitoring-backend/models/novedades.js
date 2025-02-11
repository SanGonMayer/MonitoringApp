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
  // Nombre o identificador del host
  host: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // Motivo o descripción de la novedad
  motivo: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  },
  // Estado o status de la novedad
  status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'Novedades',
  timestamps: true, // Se utilizarán createdAt y updatedAt
});

export default Novedad;
