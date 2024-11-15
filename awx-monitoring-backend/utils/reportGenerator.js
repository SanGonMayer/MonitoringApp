import { Parser } from 'json2csv';

export const generateCSVReport = (counters, hosts) => {
    const csvFields = ['Type', 'Actualizado', 'Pendiente', 'Fallido'];
    const csvData = [
        { Type: 'WST', ...counters.wst },
        { Type: 'CCTV', ...counters.cctv },
    ];

    const parser = new Parser({ fields: csvFields });
    const csvSummary = parser.parse(csvData);

    const hostFields = ['ID', 'Name', 'Description', 'Filial_ID', 'Status'];
    const parserHosts = new Parser({ fields: hostFields });
    const csvHosts = parserHosts.parse(hosts.map(h => ({
        ID: h.id,
        Name: h.name,
        Description: h.description,
        Filial_ID: h.filial_id,
        Status: h.status,
    })));

    return `${csvSummary}\n\n${csvHosts}`;
};
