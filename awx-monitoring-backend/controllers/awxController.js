import axios from 'axios';
import { Workstation } from  '../models/Workstation';  // Importa el modelo Workstation
const awxApiUrl = process.env.AWX_API_URL;  // Obtenido de las variables de entorno (.env)

// Controlador para obtener y guardar hosts de AWX en la base de datos
exports.getAndSaveHostsFromAWX = async (req, res) => {
  try {
    // Hacer una solicitud a la API de AWX para obtener los hosts
    const response = await axios.get(`${awxApiUrl}/hosts/`, {
      auth: {
        username: process.env.AWX_USER,
        password: process.env.AWX_PASSWORD
      }
    });

    const hosts = response.data.results;  // Los hosts están en la propiedad 'results' del JSON devuelto

    // Guardar los hosts en la base de datos
    const savedHosts = await Promise.all(hosts.map(async (host) => {
      const [newHost, created] = await Workstation.findOrCreate({
        where: { hostname: host.name },  // Evitar duplicados buscando por hostname
        defaults: {
          hostname: host.name,
          lastVersionApplied: host.summary_fields.last_job.job_template_name,  // Suponiendo que esta es la última versión aplicada
          status: host.summary_fields.last_job.status  // Suponiendo que esto es el estado
        }
      });
      return newHost;
    }));

    res.status(200).json({ message: 'Hosts guardados en la base de datos', savedHosts });
  } catch (error) {
    console.error('Error al guardar hosts de AWX:', error.message);
    res.status(500).json({ message: 'Error al conectar con AWX' });
  }
};
