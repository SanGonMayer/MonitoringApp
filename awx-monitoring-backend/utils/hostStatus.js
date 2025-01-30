export const calculateHostStatus = (host, tipoTerminal) => {
  // 1. Ordenar los trabajos por fecha de creación (de más reciente a más antiguo)
  const jobSummaries = (host.jobSummaries || []).sort((a, b) => new Date(b.jobCreationDate) - new Date(a.jobCreationDate));

  if (tipoTerminal === 'wst') {
    // 2. Buscar el último wst_ipa_v que se aplicó correctamente (no fallido)
    const lastSuccessfulIPAIndex = jobSummaries.findIndex(
      summary => summary.job_name.startsWith('wst_ipa_v') && !summary.failed
    );
    const hasSuccessfulIPA = lastSuccessfulIPAIndex !== -1;

    // 3. Filtrar trabajos POSTERIORES al último wst_ipa_v exitoso
    const relevantSummaries = hasSuccessfulIPA ? jobSummaries.slice(0, lastSuccessfulIPAIndex) : jobSummaries;

    // 4. Verificar si hay AL MENOS UN wst_upd_v1.8.1 exitoso en los trabajos relevantes
    const hasSuccessfulUpdate = relevantSummaries.some(
      summary => summary.job_name === 'wst_upd_v1.8.1' && !summary.failed
    );

    // 5. Verificar si hay AL MENOS UN wst_upd_v1.8.1 fallido en los trabajos relevantes
    const hasFailedUpdate = relevantSummaries.some(
      summary => summary.job_name === 'wst_upd_v1.8.1' && summary.failed
    );

    // Regla 1: Si hay un wst_ipa_v exitoso y AL MENOS UN wst_upd_v1.8.1 exitoso después, estado es actualizado
    if (hasSuccessfulIPA && hasSuccessfulUpdate) {
      return 'actualizado';
    }

    // Regla 2: Si hay un wst_ipa_v exitoso y NO HAY NINGÚN wst_upd_v1.8.1 exitoso después, estado es fallido
    if (hasSuccessfulIPA && !hasSuccessfulUpdate && hasFailedUpdate) {
      return 'fallido';
    }

    // Regla 4: Si no hay wst_ipa_v exitoso y hay AL MENOS UN wst_upd_v1.8.1 exitoso, estado es actualizado
    if (!hasSuccessfulIPA && hasSuccessfulUpdate) {
      return 'actualizado';
    }

    // Regla 3: Si hay un wst_ipa_v exitoso y no hay ningún wst_upd_v1.8.1 posterior, estado es pendiente
    if (hasSuccessfulIPA) {
      return 'pendiente';
    }

    // Si no hay wst_ipa_v exitoso ni wst_upd_v1.8.1 exitoso, estado es pendiente
    return 'pendiente';
  }

  // Lógica para otros tipos de terminal cctv
  if (tipoTerminal === 'cctv') {
    const successfulUpdate = jobSummaries.find(
      summary => summary.job_name === 'ctv_upd_v0.2.0' && !summary.failed
    );

    if (successfulUpdate) {
      return 'actualizado';
    }

    if (jobSummaries.some(summary => summary.job_name === 'ctv_upd_v0.2.0' && summary.failed)) {
      return 'fallido';
    }

    return 'pendiente';
  }

  // Si el tipo de terminal no es reconocido, estado es pendiente
  return 'pendiente';
};