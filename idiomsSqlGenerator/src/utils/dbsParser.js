/**
 * Procesa un archivo .dbs (XML) y cuenta las tablas.
 * @param {File} file - El archivo a procesar
 * @returns {Promise<string>} - El texto de salida formateado para la consola
 */
export async function parseDBSFile(file) {
  if (!file) throw new Error("No hay archivo para analizar.");
  
  const text = await file.text();
    
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "text/xml");
  
  const parseError = xmlDoc.getElementsByTagName("parsererror");
  if (parseError.length > 0) {
    throw new Error("El archivo contiene un XML no válido.");
  }

  // 3. Extraemos la información
  const tables = xmlDoc.getElementsByTagName("table");
  const tableCount = tables.length;
  
  const tableNames = Array.from(tables).map(
    (t, i) => `  ${i + 1}. ${t.getAttribute("name")}`
  );
  
  return `> parsing schema ................ ok
> entitys detected ............... ${tableCount.toString().padStart(2, '0')}
> generating output.txt ......... done

// Schema Analysis Complete
// Found ${tableCount} entitys in the database:
${tableNames.join('\n')}
`;
}