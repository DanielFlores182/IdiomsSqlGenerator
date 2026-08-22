// Funciones auxiliares para formato de texto
const toPascalCase = (str) => 
  str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');

const toCamelCase = (str) => {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

// Mapeo de tipos de base de datos a tipos de Java
const mapTypeToJava = (sqlType) => {
  const type = sqlType.toUpperCase();
  if (type.includes('INT')) return 'Integer';
  if (type.includes('CHAR') || type.includes('TEXT') || type.includes('VARCHAR')) return 'String';
  if (type.includes('DATE') || type.includes('TIME') || type.includes('DATETIME')) return 'Date';
  if (type.includes('DECIMAL') || type.includes('NUMERIC') || type.includes('FLOAT')) return 'Double';
  return 'Object'; // Fallback
};

/**
 * Genera archivos .java de entidad a partir del nodo XML de una tabla "basic".
 * Si la tabla tiene llave compuesta, genera también la clase PK Embeddable.
 * @param {Element} tableNode - El nodo XML <table>
 * @returns {Array} - Arreglo de objetos { filename: string, content: string }
 */
export function generateBasicEntity(tableNode) {
  const tableName = tableNode.getAttribute("name");
  const className = toPascalCase(tableName);
  const camelClassName = toCamelCase(tableName);

  // Extraer columnas
  const columns = Array.from(tableNode.getElementsByTagName("column"));
  
  // Buscar la llave primaria (Primary Key)
  const pkIndex = Array.from(tableNode.getElementsByTagName("index"))
    .find(idx => idx.getAttribute("unique") === "PRIMARY_KEY");
  
  let pkColumnNames = [];
  if (pkIndex) {
    pkColumnNames = Array.from(pkIndex.getElementsByTagName("column")).map(c => c.getAttribute("name"));
  } else if (columns.length > 0) {
    pkColumnNames = [columns[0].getAttribute("name")]; // Fallback
  }

  const isCompositePK = pkColumnNames.length > 1;
  const filesToGenerate = [];

  
  // Caso 1: LLAVE PRIMARIA COMPUESTA (Múltiples PKs)
  if (isCompositePK) {
    const pkClassName = `${className}PK`;
    const pkCamelName = `${camelClassName}PK`;

    // 1.1 GENERAR LA CLASE EMBEDDABLE (Ej: EntidadPK.java)
    let pkImports = new Set([
      "import jakarta.persistence.Column;",
      "import jakarta.persistence.Embeddable;",
      "import java.io.Serializable;"
    ]);
    let pkFieldsCode = "";
    let pkGettersSettersCode = "";

    const pkColumns = columns.filter(c => pkColumnNames.includes(c.getAttribute("name")));
    
    pkColumns.forEach(col => {
      const colName = col.getAttribute("name");
      const javaType = mapTypeToJava(col.getAttribute("type"));
      const camelColName = toCamelCase(colName);
      const pascalColName = toPascalCase(colName);

      if (javaType === 'Date') {
        pkImports.add("import java.util.Date;");
        pkImports.add("import jakarta.persistence.Temporal;");
        pkImports.add("import jakarta.persistence.TemporalType;");
        pkFieldsCode += `    @Temporal(TemporalType.TIMESTAMP)\n`;
      }
      pkFieldsCode += `    @Column(name = "${colName}")\n`;
      pkFieldsCode += `    private ${javaType} ${camelColName};\n\n`;

      pkGettersSettersCode += `    public ${javaType} get${pascalColName}() {\n        return ${camelColName};\n    }\n\n`;
      pkGettersSettersCode += `    public void set${pascalColName}(${javaType} ${camelColName}) {\n        this.${camelColName} = ${camelColName};\n    }\n\n`;
    });

    const pkClassContent = `package ibridge;

${Array.from(pkImports).sort().join('\n')}

@Embeddable
public class ${pkClassName} implements Serializable {

    private static final long serialVersionUID = 1L;

${pkFieldsCode}
    public ${pkClassName}() {
    }

${pkGettersSettersCode}
    // Métodos hashCode y equals obligatorios para Embeddable omitidos por brevedad,
    // pero puedes añadir el autogenerado de Java aquí si lo necesitas.
}
`;
    filesToGenerate.push({ filename: `${pkClassName}.java`, content: pkClassContent });

    // 1.2 GENERAR LA CLASE PRINCIPAL CON @EmbeddedId (Ej: Entidad.java)
    let mainImports = new Set([
      "import jakarta.persistence.EmbeddedId;",
      "import jakarta.persistence.Entity;",
      "import jakarta.persistence.NamedQueries;",
      "import jakarta.persistence.NamedQuery;",
      "import jakarta.persistence.Table;",
      "import java.io.Serializable;"
    ]);
    
    let mainFieldsCode = `    @EmbeddedId\n    protected ${pkClassName} ${pkCamelName};\n\n`;
    let mainGettersSettersCode = `    public ${pkClassName} get${pkClassName}() {\n        return ${pkCamelName};\n    }\n\n`;
    mainGettersSettersCode += `    public void set${pkClassName}(${pkClassName} ${pkCamelName}) {\n        this.${pkCamelName} = ${pkCamelName};\n    }\n\n`;

    let namedQueriesCode = `    @NamedQuery(name = "${className}.findAll", query = "SELECT p FROM ${className} p")`;

    const nonPkColumns = columns.filter(c => !pkColumnNames.includes(c.getAttribute("name")));
    
    nonPkColumns.forEach(col => {
      const colName = col.getAttribute("name");
      const javaType = mapTypeToJava(col.getAttribute("type"));
      const camelColName = toCamelCase(colName);
      const pascalColName = toPascalCase(colName);

      if (javaType === 'Date') {
        mainImports.add("import java.util.Date;");
        mainImports.add("import jakarta.persistence.Temporal;");
        mainImports.add("import jakarta.persistence.TemporalType;");
        mainFieldsCode += `    @Temporal(TemporalType.TIMESTAMP)\n`;
      }
      
      namedQueriesCode += `,\n    @NamedQuery(name = "${className}.findBy${pascalColName}", query = "SELECT p FROM ${className} p WHERE p.${camelColName} = :${camelColName}")`;
      
      mainFieldsCode += `    @Column(name = "${colName}")\n`;
      mainFieldsCode += `    private ${javaType} ${camelColName};\n\n`;

      mainGettersSettersCode += `    public ${javaType} get${pascalColName}() {\n        return ${camelColName};\n    }\n\n`;
      mainGettersSettersCode += `    public void set${pascalColName}(${javaType} ${camelColName}) {\n        this.${camelColName} = ${camelColName};\n    }\n\n`;
    });

    const mainClassContent = `package ibridge;

${Array.from(mainImports).sort().join('\n')}

@Entity
@Table(name = "${tableName}")
@NamedQueries({
${namedQueriesCode}
})
public class ${className} implements Serializable {

    private static final long serialVersionUID = 1L;

${mainFieldsCode}
    public ${className}() {
    }

    public ${className}(${pkClassName} ${pkCamelName}) {
        this.${pkCamelName} = ${pkCamelName};
    }

${mainGettersSettersCode}
    @Override
    public int hashCode() {
        int hash = 0;
        hash += (${pkCamelName} != null ? ${pkCamelName}.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        if (!(object instanceof ${className})) {
            return false;
        }
        ${className} other = (${className}) object;
        if ((this.${pkCamelName} == null && other.${pkCamelName} != null) || (this.${pkCamelName} != null && !this.${pkCamelName}.equals(other.${pkCamelName}))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "ibridge.${className}[ ${pkCamelName}=" + ${pkCamelName} + " ]";
    }
}
`;
    filesToGenerate.push({ filename: `${className}.java`, content: mainClassContent });

  } 
  // =========================================================================
  // CASO 2: LLAVE PRIMARIA SIMPLE (1 PK) - Comportamiento Original
  // =========================================================================
  else {
    const pkName = pkColumnNames.length > 0 ? pkColumnNames[0] : "id";
    const pkJavaType = columns.find(c => c.getAttribute("name") === pkName) 
      ? mapTypeToJava(columns.find(c => c.getAttribute("name") === pkName).getAttribute("type")) 
      : "Integer";
    const pkCamelName = toCamelCase(pkName);

    let imports = new Set([
      "import jakarta.persistence.Column;",
      "import jakarta.persistence.Entity;",
      "import jakarta.persistence.Id;",
      "import jakarta.persistence.NamedQueries;",
      "import jakarta.persistence.NamedQuery;",
      "import jakarta.persistence.Table;",
      "import java.io.Serializable;"
    ]);
    
    let fieldsCode = "";
    let gettersSettersCode = "";
    let namedQueriesCode = `    @NamedQuery(name = "${className}.findAll", query = "SELECT p FROM ${className} p")`;

    columns.forEach(col => {
      const colName = col.getAttribute("name");
      const javaType = mapTypeToJava(col.getAttribute("type"));
      const camelColName = toCamelCase(colName);
      const pascalColName = toPascalCase(colName);

      if (javaType === 'Date') {
        imports.add("import java.util.Date;");
        imports.add("import jakarta.persistence.Temporal;");
        imports.add("import jakarta.persistence.TemporalType;");
      }

      if (!pkColumnNames.includes(colName)) {
        namedQueriesCode += `,\n    @NamedQuery(name = "${className}.findBy${pascalColName}", query = "SELECT p FROM ${className} p WHERE p.${camelColName} = :${camelColName}")`;
      }

      if (pkColumnNames.includes(colName)) fieldsCode += `    @Id\n`;
      fieldsCode += `    @Column(name = "${colName}")\n`;
      if (javaType === 'Date') fieldsCode += `    @Temporal(TemporalType.TIMESTAMP)\n`;
      fieldsCode += `    private ${javaType} ${camelColName};\n\n`;

      gettersSettersCode += `    public ${javaType} get${pascalColName}() {\n        return ${camelColName};\n    }\n\n`;
      gettersSettersCode += `    public void set${pascalColName}(${javaType} ${camelColName}) {\n        this.${camelColName} = ${camelColName};\n    }\n\n`;
    });

    const content = `package ibridge;

${Array.from(imports).sort().join('\n')}

@Entity
@Table(name = "${tableName}")
@NamedQueries({
${namedQueriesCode}
})
public class ${className} implements Serializable {

    private static final long serialVersionUID = 1L;

${fieldsCode}
    public ${className}() {
    }

    public ${className}(${pkJavaType} ${pkCamelName}) {
        this.${pkCamelName} = ${pkCamelName};
    }

${gettersSettersCode}
    @Override
    public int hashCode() {
        int hash = 0;
        hash += (${pkCamelName} != null ? ${pkCamelName}.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        if (!(object instanceof ${className})) {
            return false;
        }
        ${className} other = (${className}) object;
        if ((this.${pkCamelName} == null && other.${pkCamelName} != null) || (this.${pkCamelName} != null && !this.${pkCamelName}.equals(other.${pkCamelName}))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "ibridge.${className}[ ${pkCamelName}=" + ${pkCamelName} + " ]";
    }
}
`;
    filesToGenerate.push({ filename: `${className}.java`, content });
  }

  return filesToGenerate;
}