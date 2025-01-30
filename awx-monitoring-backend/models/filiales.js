import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Filial = sequelize.define('Filial', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  awx_id_wst: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  awx_id_cctv: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

export const obtenerIdDeFilial = async (filialName) => {
  try {
      const filial = await Filial.findOne({
          where: {
              name: filialName
          }
      });

      if (filial) {
          return filial.id;  // Retorna el ID si se encuentra la filial
      } else {
          console.log(`Filial con el nombre ${filialName} no encontrada`);
          return null;  // Retorna null si no se encuentra
      }
  } catch (error) {
      console.error('Error al obtener el ID de la filial:', error);
      throw error;  // Lanza el error si ocurre alguno
  }
};

export default Filial;
