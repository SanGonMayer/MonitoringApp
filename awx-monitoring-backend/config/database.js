import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config(); 

const sequelize = new Sequelize(
  process.env.DB_NAME,     
  process.env.DB_USER,     
  null, 
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',  
    logging: false        
  }
);

export default sequelize;
