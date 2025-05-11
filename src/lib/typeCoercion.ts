// 📁 File: src/lib/typeCoercion.ts
export function coerceDataToTableTypes(
    rawData: Record<string, any>,
    tableMeta: Array<{ column_name: string; data_type: string }>
  ): Record<string, any> {
    const coerced: Record<string, any> = {};
  
    for (const { column_name, data_type } of tableMeta) {
      let value = rawData[column_name];
  
      // Skip undefined or null values
      if (value === undefined || value === null) continue;
  
      try {
        switch (data_type.toLowerCase()) {
          case 'numeric':
          case 'double precision':
          case 'float8':
          case 'real':
            const numericValue = parseFloat(value.toString().replace(/[^0-9.-]+/g, ''));
            if (isNaN(numericValue)) {
              console.warn(`Invalid numeric value for ${column_name}: ${value}`);
              continue;
            }
            coerced[column_name] = numericValue;
            break;
  
          case 'integer':
          case 'int':
          case 'int4':
          case 'bigint':
            const intValue = parseInt(value, 10);
            if (isNaN(intValue)) {
              console.warn(`Invalid integer value for ${column_name}: ${value}`);
              continue;
            }
            coerced[column_name] = intValue;
            break;
  
          case 'boolean':
            coerced[column_name] =
              value === true || value === 'true' || value === 'on' || value === '1' || value === 1;
            break;
  
          case 'timestamptz':
          case 'timestamp':
          case 'date':
            const dateValue = new Date(value);
            if (isNaN(dateValue.getTime())) {
              console.warn(`Invalid date value for ${column_name}: ${value}`);
              continue;
            }
            coerced[column_name] = dateValue.toISOString();
            break;
  
          case 'json':
          case 'jsonb':
            if (typeof value === 'string') {
              try {
                coerced[column_name] = JSON.parse(value);
              } catch {
                console.warn(`Could not parse JSON value for ${column_name}: ${value}`);
                continue;
              }
            } else {
              coerced[column_name] = value;
            }
            break;
  
          case 'text':
          case 'varchar':
          case 'character varying':
            coerced[column_name] = String(value).trim();
            break;
  
          default:
            console.warn(`Unsupported data type for ${column_name}: ${data_type}`);
            coerced[column_name] = String(value).trim();
            break;
        }
      } catch (err) {
        console.warn(`Error coercing value for ${column_name} (type: ${data_type}):`, err);
        continue;
      }
    }
  
    console.log(`Coerced data for ${tableMeta[0]?.column_name.split('.')[1] || 'unknown'}:`, coerced);
    return coerced;
  }