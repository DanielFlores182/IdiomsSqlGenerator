/**
 * Procesa un archivo .dbs (XML) y cuenta las tablas, is_a, classifiers, master_detail, composition, reflexives, historical_reflexives y basics.
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

  const tables = xmlDoc.getElementsByTagName("table");
  const tableCount = tables.length;
  
  const tableNames = [];
  const is_a = [];
  const classifiers = []; 
  const masterDetail = []; 
  const composition = [];  
  const reflexives = []; 
  const historicalReflexives = [];
  const basics = []; 

  const allReferencedTables = new Set();
  const outboundFkCounts = {};

  Array.from(tables).forEach((table, index) => {
    const tableName = table.getAttribute("name");
    tableNames.push(`  ${index + 1}. ${tableName}`);
    
    const fks = table.getElementsByTagName("fk");
    
    outboundFkCounts[tableName] = fks.length;
    
    const identifyingMultiTargets = [];
    
    Array.from(fks).forEach(fk => {
      const type = fk.getAttribute("type");
      const mandatory = fk.getAttribute("mandatory");
      const cardinality = fk.getAttribute("cardinality");
      const toTable = fk.getAttribute("to_table");
      
      
      allReferencedTables.add(toTable);

      // Validaciones is_a
      if (
        type === "Identifying" && 
        mandatory === "y" && 
        (cardinality === "ZeroOne" || cardinality === "One")
      ) {
        is_a.push(`  - ${tableName} is_a ${toTable}`);
      }

      // Validaciones classifiers
      if (
        type === "NonIdentifying" && 
        (cardinality === "ZeroMore" || cardinality === "OneMore") &&
        toTable !== tableName // evitar contar reflexives
      ) {
        classifiers.push(`  - ${tableName} classified_by ${toTable}`);
      }

      // Validaciones reflexives
      if (
        toTable === tableName &&
        type === "NonIdentifying" && 
        (mandatory === "y" || mandatory === "n") && 
        (cardinality === "ZeroOne" || cardinality === "One" || cardinality === "ZeroMore" || cardinality === "OneMore")
      ) {
        reflexives.push(`  - ${tableName} is reflexive`);
      }

      // Filtrado de las fks que cumplen la regla específica para master_detail, composition e historical_reflexive
      if (
        type === "Identifying" && 
        mandatory === "y" && 
        (cardinality === "ZeroMore" || cardinality === "OneMore")
      ) {
        identifyingMultiTargets.push(toTable);
      }
    });

    // Contamos cuántas veces se repite cada to_table en esta entidad
    const targetCounts = {};
    identifyingMultiTargets.forEach(t => {
      targetCounts[t] = (targetCounts[t] || 0) + 1;
    });

    const remainingTargets = [];

    // Separamos los que son históricos de los que son relaciones (master_detail / composition)
    for (const [target, count] of Object.entries(targetCounts)) {
      if (count >= 2) {
        // Si hay 2 o más FKs apuntando a la misma tabla con estas reglas, es historical_reflexive
        historicalReflexives.push(`  - ${target} is historical_reflexive with ${tableName}`);
      } else {
        remainingTargets.push(target);
      }
    }
   
    if (remainingTargets.length === 1) {
      masterDetail.push(`  - ${tableName} detail_of ${remainingTargets[0]}`);
    } else if (remainingTargets.length >= 2) {
      const targetsString = remainingTargets.join(", ");
      composition.push(`  - ${tableName} composed_by (${targetsString})`);
    }
  });

  Array.from(tables).forEach(table => {
    const tableName = table.getAttribute("name");
    if (outboundFkCounts[tableName] === 0 && !allReferencedTables.has(tableName)) {
      basics.push(`  - ${tableName} is basic`);
    }
  });

  const is_aCount = is_a.length;
  const classifiersCount = classifiers.length;
  const masterDetailCount = masterDetail.length;
  const compositionCount = composition.length;
  const reflexivesCount = reflexives.length;
  const historicalReflexivesCount = historicalReflexives.length;
  const basicsCount = basics.length;

  // Bloques de texto para el reporte final
  const basicsLog = basicsCount > 0 
    ? `\n// Found ${basicsCount} basic idioms in the database:\n${basics.join('\n')}` 
    : "";

  const is_aLog = is_aCount > 0 
    ? `\n// Found ${is_aCount} is_a idioms in the database:\n${is_a.join('\n')}` 
    : "";

  const classifiersLog = classifiersCount > 0 
    ? `\n// Found ${classifiersCount} classifier idioms in the database:\n${classifiers.join('\n')}` 
    : "";

  const masterDetailLog = masterDetailCount > 0 
    ? `\n// Found ${masterDetailCount} master_detail idioms in the database:\n${masterDetail.join('\n')}` 
    : "";

  const compositionLog = compositionCount > 0 
    ? `\n// Found ${compositionCount} composition idioms in the database:\n${composition.join('\n')}` 
    : "";
    
  const reflexivesLog = reflexivesCount > 0 
    ? `\n// Found ${reflexivesCount} reflexive idioms in the database:\n${reflexives.join('\n')}` 
    : "";

  const historicalReflexivesLog = historicalReflexivesCount > 0 
    ? `\n// Found ${historicalReflexivesCount} historical_reflexive idioms in the database:\n${historicalReflexives.join('\n')}` 
    : "";
  
  return `> parsing schema ................. ok
> entitys detected ............... ${tableCount.toString().padStart(2, '0')}
> basics detected ................ ${basicsCount.toString().padStart(2, '0')}
> is_a detected .................. ${is_aCount.toString().padStart(2, '0')}
> classifiers detected ........... ${classifiersCount.toString().padStart(2, '0')}
> master_details detected ........ ${masterDetailCount.toString().padStart(2, '0')}
> compositions detected .......... ${compositionCount.toString().padStart(2, '0')}
> reflexives detected ............ ${reflexivesCount.toString().padStart(2, '0')}
> historical_reflexives detected . ${historicalReflexivesCount.toString().padStart(2, '0')}
> generating output.txt .......... done

// Schema Analysis Complete
// Found ${tableCount} entitys in the database:
${tableNames.join('\n')}
${basicsLog}
${is_aLog}
${classifiersLog}
${masterDetailLog}
${compositionLog}
${reflexivesLog}
${historicalReflexivesLog}
`;
}