/**
 * Ensures the blended model is well-formed and complies with platform rules.
 */
export function validateBlendedModel(model: any): void {
    if (!model || typeof model !== 'object') {
      throw new Error('Blended model must be an object.');
    }
    if (!Array.isArray(model.entities)) {
      throw new Error('Blended model must include an "entities" array.');
    }
  
    const reservedNames = new Set<string>();
    for (const entity of model.entities) {
      if (!entity.name || typeof entity.name !== 'string') {
        throw new Error('Each entity must have a "name" of type string.');
      }
      if (reservedNames.has(entity.name)) {
        throw new Error(`Duplicate entity name: ${entity.name}`);
      }
      reservedNames.add(entity.name);
  
      const { attributes = {}, relationships = {} } = entity;
      const attrNames = new Set(Object.keys(attributes));
      for (const relName of Object.keys(relationships)) {
        if (attrNames.has(relName)) {
          throw new Error(`Entity "${entity.name}" has duplicate name "${relName}" as both attribute and relationship.`);
        }
      }
    }
  }
  
  /**
   * Cleans and adjusts a blended model before validation.
   * For example, resolves attribute vs. relationship conflicts.
   */
  export function sanitizeBlendedModel(model: any): any {
    for (const entity of model.entities || []) {
      const attrNames = new Set(Object.keys(entity.attributes || {}));
      const rels = entity.relationships || {};
      for (const key of Object.keys(rels)) {
        if (attrNames.has(key)) {
          // Conflict: remove the attribute to defer to relationship
          delete entity.attributes[key];
        }
      }
    }
    return model;
  } 