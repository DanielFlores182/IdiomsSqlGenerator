/**
 * Analiza el JSON de idioms y devuelve el orden topológico de generación,
 * junto con un diccionario que detalla de qué entidades depende y cuáles dependen de ella.
 * @param {Object} jsonData - El objeto JSON generado por dbsParser.js
 * @returns {Object} { generationOrder, entityProfiles }
 */
export function buildGenerationOrder(jsonData) {
  const { entities, idioms } = jsonData;

  // 1. Inicializar estructuras del grafo y los perfiles
  const inDegree = {};
  const adjList = {};
  const entityProfiles = {};

  entities.forEach(ent => {
    inDegree[ent] = 0;
    adjList[ent] = [];
    
    entityProfiles[ent] = {
      name: ent,
      is_basic: false,
      is_reflexive: false,
      
      // LAS QUE NECESITAMOS: Esta entidad depende de las que están aquí (Ellas son las fuertes)
      strong_entities: {
        is_a: [],
        classified_by: [],
        detail_of: [],
        composed_by: [],
        historical_reflexive_with: []
      },
      
      // LAS QUE NOS NECESITAN: Las entidades aquí dependen de nosotros (Ellas son las débiles)
      weak_entities: {
        parent_of: [],
        classifier_of: [],
        master_of: [],
        component_of: [],
        historical_original_for: []
      }
    };
  });

  const addDependency = (weak, strong) => {
    inDegree[weak]++;
    adjList[strong].push(weak);
  };

  // 2. Llenar los perfiles y dependencias bidireccionalmente

  idioms.basics.forEach(ent => entityProfiles[ent].is_basic = true);
  idioms.reflexives.forEach(ent => entityProfiles[ent].is_reflexive = true);

  // is_a
  idioms.is_a.forEach(rel => {
    addDependency(rel.weak, rel.strong);
    entityProfiles[rel.weak].strong_entities.is_a.push(rel.strong);
    entityProfiles[rel.strong].weak_entities.parent_of.push(rel.weak); 
  });

  // classifiers
  idioms.classifiers.forEach(rel => {
    addDependency(rel.weak, rel.strong);
    entityProfiles[rel.weak].strong_entities.classified_by.push(rel.strong);
    entityProfiles[rel.strong].weak_entities.classifier_of.push(rel.weak); 
  });

  // master_detail
  idioms.master_detail.forEach(rel => {
    addDependency(rel.weak, rel.strong);
    entityProfiles[rel.weak].strong_entities.detail_of.push(rel.strong);
    entityProfiles[rel.strong].weak_entities.master_of.push(rel.weak); 
  });

  // historical_reflexives
  idioms.historical_reflexives.forEach(rel => {
    addDependency(rel.weak, rel.strong);
    entityProfiles[rel.weak].strong_entities.historical_reflexive_with.push(rel.strong);
    entityProfiles[rel.strong].weak_entities.historical_original_for.push(rel.weak); 
  });

  // composition (El lado fuerte es un arreglo)
  idioms.composition.forEach(rel => {
    rel.strong.forEach(strongEntity => {
      addDependency(rel.weak, strongEntity);
      entityProfiles[strongEntity].weak_entities.component_of.push(rel.weak); 
    });
    entityProfiles[rel.weak].strong_entities.composed_by.push(...rel.strong);
  });

  // 3. Algoritmo de Kahn (Ordenamiento Topológico)
  const queue = [];
  const generationOrder = []; // <-- Este es tu orden de creación

  entities.forEach(ent => {
    if (inDegree[ent] === 0) {
      queue.push(ent);
    }
  });

  while (queue.length > 0) {
    const current = queue.shift();
    generationOrder.push(current);

    adjList[current].forEach(dependent => {
      inDegree[dependent]--;
      if (inDegree[dependent] === 0) {
        queue.push(dependent);
      }
    });
  }

  // 4. Prevención de ciclos infinitos
  if (generationOrder.length !== entities.length) {
    const missing = entities.filter(ent => !generationOrder.includes(ent));
    console.warn("⚠️ Dependencia circular detectada. Tablas sin resolver:", missing);
    generationOrder.push(...missing);
  }

  // Retorna ambas cosas: El arreglo con el orden y el objeto con todos los perfiles
  return {
    generationOrder,
    entityProfiles
  };
}