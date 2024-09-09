
# DocxToHtmlInteractiveComponent

`DocxToHtmlInteractiveComponent` es un Web Component personalizado que convierte archivos `.docx` en HTML interactivo y permite interactuar con diferentes tipos de entradas, como texto, fechas, archivos, imágenes, y más. También admite la creación de tablas dinámicas donde se pueden agregar y eliminar filas. El estado de los datos puede ser guardado y restaurado en formato JSON.

## Características

- Convierte archivos `.docx` en HTML interactivo.
- Soporta inputs dinámicos: texto, número, fechas, checkbox, archivos e imágenes.
- Permite agregar y eliminar filas en tablas dinámicas.
- Guarda y restaura el estado de los datos en formato JSON.
- Soporte para imágenes a través de `base64` para vista previa.

## Instalación

Para instalar el componente desde GitHub Packages (si es privado), sigue estos pasos:

1. Asegúrate de haber configurado tu `.npmrc` para autenticarte en GitHub Packages:

```bash
//npm.pkg.github.com/:_authToken=YOUR_PERSONAL_ACCESS_TOKEN
@ArmandoGutierrez777:registry=https://npm.pkg.github.com
```

2. Instala el paquete:

```bash
npm install @ArmandoGutierrez777/docx-to-html-interactive
```

## Uso

### En HTML:

```html
<docx-to-html-interactive></docx-to-html-interactive>

<script>
  const docxComponent = document.querySelector("docx-to-html-interactive");
  
  // Cargar un archivo .docx
  const fileInput = document.getElementById("fileInput");
  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    docxComponent.docxFile = file;
  });

  // Obtener los datos del formulario en JSON
  const saveButton = document.getElementById("saveButton");
  saveButton.addEventListener("click", async () => {
    const formData = await docxComponent.getData();
    console.log("Datos guardados: ", JSON.stringify(formData));
  });

  // Restaurar datos desde JSON (opcional)
  const jsonData = { /* JSON con los datos */ };
  if (jsonData) {
    docxComponent.jsonData = jsonData;
  }
</script>
```

### En Vue.js:

```html
<template>
  <div>
    <input type="file" @change="onFileChange" />
    <docx-to-html-interactive ref="docxComponent"></docx-to-html-interactive>
    <button @click="saveData">Guardar</button>
  </div>
</template>

<script>
export default {
  methods: {
    onFileChange(event) {
      const file = event.target.files[0];
      this.$refs.docxComponent.docxFile = file;
    },
    async saveData() {
      const formData = await this.$refs.docxComponent.getData();
      console.log("Datos guardados: ", JSON.stringify(formData));
    }
  },
  mounted() {
    // Restaurar datos desde JSON (opcional)
    const jsonData = { /* JSON con los datos */ };
    if (jsonData) {
      this.$refs.docxComponent.jsonData = jsonData;
    }
  }
}
</script>
```

### En Angular:

```html
<!-- template.component.html -->
<input type="file" (change)="onFileChange($event)">
<docx-to-html-interactive #docxComponent></docx-to-html-interactive>
<button (click)="saveData()">Guardar</button>
```

```typescript
// template.component.ts
import { Component, ViewChild } from '@angular/core';

@Component({
  selector: 'app-template',
  templateUrl: './template.component.html',
})
export class TemplateComponent {
  @ViewChild('docxComponent', { static: true }) docxComponent: any;

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files[0];
    this.docxComponent.docxFile = file;
  }

  async saveData() {
    const formData = await this.docxComponent.getData();
    console.log("Datos guardados: ", JSON.stringify(formData));
  }

  ngOnInit() {
    // Restaurar datos desde JSON (opcional)
    const jsonData = { /* JSON con los datos */ };
    if (jsonData) {
      this.docxComponent.jsonData = jsonData;
    }
  }
}
```

### En React:

```jsx
import React, { useRef, useEffect } from "react";

function App() {
  const docxComponent = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    docxComponent.current.docxFile = file;
  };

  const saveData = async () => {
    const formData = await docxComponent.current.getData();
    console.log("Datos guardados: ", JSON.stringify(formData));
  };

  useEffect(() => {
    // Restaurar datos desde JSON (opcional)
    const jsonData = { /* JSON con los datos */ };
    if (jsonData) {
      docxComponent.current.jsonData = jsonData;
    }
  }, []);

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <docx-to-html-interactive ref={docxComponent}></docx-to-html-interactive>
      <button onClick={saveData}>Guardar</button>
    </div>
  );
}

export default App;
```

## Conversión de Anclas en Inputs

Durante la conversión de `.docx` a HTML, ciertos marcadores de posición en el contenido del `.docx` se transforman en inputs interactivos en el HTML generado:

| Placeholder en `.docx` | Input generado en HTML   | Descripción                       |
|------------------------|-------------------------|-----------------------------------|
| `CH1`                  | `checkbox`              | Casilla de verificación           |
| `TA1`                  | `textarea`              | Área de texto                     |
| `DI1`                  | `input[type="date"]`    | Campo para seleccionar una fecha  |
| `HI1`                  | `input[type="time"]`    | Campo para seleccionar una hora   |
| `TI1`                  | `input[type="text"]`    | Campo de texto                    |
| `IMG1`                 | `input[type="file"]`    | Campo para subir una imagen       |

## API

### Propiedades

- **`docxFile`**: Asigna un archivo `.docx` que será convertido a HTML.
  
  ```javascript
  docxComponent.docxFile = file;
  ```

- **`jsonData`**: Asigna un objeto JSON con los datos guardados para restaurar el estado del formulario (opcional).

  ```javascript
  docxComponent.jsonData = jsonData;
  ```

### Métodos

- **`getData()`**: Devuelve un objeto con los datos del formulario en formato JSON.

  ```javascript
  const formData = await docxComponent.getData();
  ```

## Personalización de Estilos

El componente utiliza un `Shadow DOM`, por lo que los estilos externos no afectan a su contenido. Puedes personalizar los estilos dentro del componente modificando directamente el archivo del componente.
