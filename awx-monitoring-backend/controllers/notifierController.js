import { sendReportViaTelegram } from '../services/notifierService.js';

export const sendTestTelegramMessage = async (req, res) => {
  const testReport = 'Este es un mensaje de prueba de sincronización de datos';

  try {
    await sendReportViaTelegram(testReport);
    res.status(200).json({ message: 'Mensaje de prueba enviado exitosamente' });
  } catch (error) {
    console.error('Error al enviar el mensaje de prueba:', error.message);
    res.status(500).json({ error: 'Error al enviar el mensaje de prueba' });
  }
};
