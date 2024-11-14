export const calculateHostStatus = (host, tipoTerminal) => {
    const jobSummaries = (host.jobSummaries || []).sort((a, b) => new Date(b.jobCreationDate) - new Date(a.jobCreationDate));
    
    if (tipoTerminal === 'wst') {
      const lastIPAIndex = jobSummaries.findIndex(summary => summary.job_name.startsWith('wst_ipa_v'));
      const hasIPA = lastIPAIndex !== -1;
  
      const successfulUpdateAfterIPA = jobSummaries.slice(0, lastIPAIndex).find(
        summary => summary.job_name === 'wst_upd_v1.7.19' && !summary.failed
      );
  
      if (!hasIPA && jobSummaries.some(summary => summary.job_name === 'wst_upd_v1.7.19' && !summary.failed)) {
        return 'actualizado';
      }
      
      if (hasIPA && successfulUpdateAfterIPA) {
        return 'actualizado';
      }
  
      if (jobSummaries.some(summary => summary.job_name === 'wst_upd_v1.7.19' && summary.failed)) {
        return 'fallido';
      }
  
      return 'pendiente';
    } 
    
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
  
    return 'pendiente';
  };
  