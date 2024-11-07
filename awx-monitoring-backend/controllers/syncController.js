import { syncSingleFilial } from '../services/syncService.js';

export const updateSingleFilial = async (req, res) => {
    const { filialId } = req.params;
    try {
        await syncSingleFilial(filialId);
        res.status(200).json({ message: `Filial ${filialId} actualizada correctamente.` });
    } catch (error) {
        console.error('Error al actualizar la filial:', error.message);
        res.status(500).json({ error: 'Error al actualizar la filial' });
    }
};