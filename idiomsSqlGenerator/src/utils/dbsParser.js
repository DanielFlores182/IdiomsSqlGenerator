/**
 * Procesa un archivo .dbs (XML) y cuenta las tablas, is_a, classifiers, master_detail, composition, reflexives, historical_reflexives y basics.
 * @param {File} file - El archivo a procesar
 * @returns {Promise<{ report: string, jsonData: object }>} - Retorna el texto para la consola y el JSON estructurado
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

  const jsonData = {
    entities: [],
    idioms: {
      basics: [],
      is_a: [],
      classifiers: [],
      master_detail: [],
      composition: [],
      reflexives: [],
      historical_reflexives: []
    }
  };

  const allReferencedTables = new Set();
  const outboundFkCounts = {};

  Array.from(tables).forEach((table, index) => {
    const tableName = table.getAttribute("name");
    tableNames.push(`  ${index + 1}. ${tableName}`);
    
    jsonData.entities.push(tableName);
    
    const fks = table.getElementsByTagName("fk");
    
    outboundFkCounts[tableName] = fks.length;
    
    const identifyingMultiRelations = [];
    
    Array.from(fks).forEach(fk => {
      const type = fk.getAttribute("type");
      const mandatory = fk.getAttribute("mandatory");
      const cardinality = fk.getAttribute("cardinality");
      const toTable = fk.getAttribute("to_table");
      
      allReferencedTables.add(toTable);

      if (
        type === "Identifying" && 
        mandatory === "y" && 
        (cardinality === "ZeroOne" || cardinality === "One")
      ) {
        is_a.push(`  - ${tableName} is_a_ ${toTable}`);
        jsonData.idioms.is_a.push({ weak: tableName, strong: toTable });
      }

      if (
        type === "NonIdentifying" && 
        (cardinality === "ZeroMore" || cardinality === "OneMore") &&
        toTable !== tableName // evitar contar reflexives
      ) {
        classifiers.push(`  - ${tableName} classified_by ${toTable}`);
        jsonData.idioms.classifiers.push({ weak: tableName, strong: toTable });
      }

      if (
        toTable === tableName &&
        type === "NonIdentifying" && 
        (mandatory === "y" || mandatory === "n") && 
        (cardinality === "ZeroOne" || cardinality === "One" || cardinality === "ZeroMore" || cardinality === "OneMore")
      ) {
        reflexives.push(`  - ${tableName} is_reflexive`);
        jsonData.idioms.reflexives.push(tableName); // Solo requiere el nombre
      }

      if (
        type === "Identifying" && 
        mandatory === "y" && 
        (cardinality === "ZeroMore" || cardinality === "OneMore")
      ) {
        identifyingMultiRelations.push(toTable);
      }
    });

    const targetCounts = {};
    identifyingMultiRelations.forEach(t => {
      targetCounts[t] = (targetCounts[t] || 0) + 1;
    });

    const remainingTargets = [];

    for (const [target, count] of Object.entries(targetCounts)) {
      if (count >= 2) {
        historicalReflexives.push(`  - ${target} is_historical_reflexive_with ${tableName}`);
        jsonData.idioms.historical_reflexives.push({ weak: tableName, strong: target });
      } else {
        remainingTargets.push(target);
      }
    }
   
    if (remainingTargets.length === 1) {
      masterDetail.push(`  - ${tableName} detail_of ${remainingTargets[0]}`);
      jsonData.idioms.master_detail.push({ weak: tableName, strong: remainingTargets[0] });
    } else if (remainingTargets.length >= 2) {
      const targetsString = remainingTargets.join(", ");
      composition.push(`  - ${tableName} composed_by (${targetsString})`);
      jsonData.idioms.composition.push({ weak: tableName, strong: remainingTargets }); // strong será un array
    }
  });

  Array.from(tables).forEach(table => {
    const tableName = table.getAttribute("name");
    if (outboundFkCounts[tableName] === 0 && !allReferencedTables.has(tableName)) {
      basics.push(`  - ${tableName} is_basic`);
      jsonData.idioms.basics.push(tableName);
    }
  });

  const is_aCount = is_a.length;
  const classifiersCount = classifiers.length;
  const masterDetailCount = masterDetail.length;
  const compositionCount = composition.length;
  const reflexivesCount = reflexives.length;
  const historicalReflexivesCount = historicalReflexives.length;
  const basicsCount = basics.length;

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
  
  const report = `> parsing schema ................. ok
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

  return { report, jsonData };
}