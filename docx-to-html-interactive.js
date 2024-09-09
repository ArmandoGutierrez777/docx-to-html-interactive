import { renderAsync } from "docx-preview";

class DocxToHtmlInteractiveComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Define the structure and styles of the Web Component
    this.shadowRoot.innerHTML = `
      <style>

      input {
        border: none;
        width: auto;
        background-color: transparent;
      }

      div input[type="text"] {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        vertical-align: top;
      }

      div input[type="number"] {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        vertical-align: top;
      }

      div input[type="date"] {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        vertical-align: top;
        font-size: 10px;
      }

      div input[type="time"] {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        vertical-align: top;
        font-size: 10px;
      }

      div input[type="file"] {
        width: 100%;
        height: 100%;
        display: none;
        box-sizing: border-box;
        vertical-align: top;
      }

      .img-preview {
        width: 100px;
        height: 100px;
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border: 1px solid #ddd;
        cursor: pointer;
        display: block;
        margin: auto;
      }

      .upload-icon {
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        margin: auto;
      }

      .upload-icon img:hover {
        filter: invert(35%) sepia(89%) saturate(466%) hue-rotate(176deg) brightness(92%) contrast(92%);
      }

      input[type="number"]::-webkit-inner-spin-button,
      input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      /* Checkbox custom styles */
      input[type="checkbox"] {
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        outline: none;
        border: none;
        width: 16px;
        height: 16px;
        vertical-align: middle;
        position: relative;
        cursor: pointer;
        box-sizing: border-box;
      }

      /* For checked state */
      input[type="checkbox"][data-state="checked"]::before {
        content: "✓";
        color: #000;
        font-size: 14px;
        position: absolute;
        top: 50%;
        left: 40%;
        transform: translate(-50%, -50%);
      }

      /* For indeterminate state */
      input[type="checkbox"][data-state="indeterminate"]::before {
        content: "—";
        color: #000;
        font-size: 14px;
        position: absolute;
        top: 50%;
        left: 40%;
        transform: translate(-50%, -50%);
      }

      /* For unchecked state */
      input[type="checkbox"][data-state="unchecked"]::before {
        content: "X";
        color: #000;
        font-size: 14px;
        position: absolute;
        top: 50%;
        left: 40%;
        transform: translate(-50%, -50%);
      }

      textarea {
        resize: none;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        white-space: normal;
        border: none;
        background-color: transparent;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th, td {
        border: 1px solid #000;
        padding: 8px;
      }

      .table-buttons button {
        border: none;
        background-color: transparent;
        cursor: pointer;
        font-size: 18px;
        margin-right: 10px;
      }

      .table-buttons button:hover {
        color: #007bff;
      }

      .popover {
        display: none;
        position: absolute;
        background-color: white;
        border: 1px solid #ddd;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        padding: 10px;
        border-radius: 8px;
        z-index: 10;
        transition: opacity 0.3s ease;
      }

      .popover.active {
        display: block;
        opacity: 1;
      }

      .popover button {
        border: none;
        background-color: transparent;
        cursor: pointer;
        font-size: 18px;
        margin-right: 10px;
      }

      .popover button img:hover {
        filter: invert(35%) sepia(89%) saturate(466%) hue-rotate(176deg) brightness(92%) contrast(92%);
      }
      </style>

      <!-- Contenedor para mostrar el contenido transformado -->
      <div id="container" class="docx-container"></div>
    `;

    this.docxContainer = this.shadowRoot.querySelector("#container");

    // Initialize global variables
    this.generatedHtml = "";
    this.checkboxCounter = 1;
    this.textareaCounter = 1;
    this.dateCounter = 1;
    this.timeCounter = 1;
    this.textCounter = 1;
    this.imgCounter = 1;
    this.activePopover = null;
    this.jsonData = null;
  }

  // Setter for the docxFile property to process DOCX files
  set docxFile(file) {
    if (file instanceof File) {
      this.#renderDocx(file);
    } else {
      console.error("El archivo proporcionado no es válido.");
    }
  }

  // Setter for jsonData, ensuring data can be applied to the generated HTML
  set jsonData(data) {
    if (typeof data === "object") {
      this.jsonDataRestore = data;
      if (this.generatedHtml) {
        this.#applyJsonData();
      }
    } else {
      console.error("Los datos JSON proporcionados no son válidos.");
    }
  }

  // Method to extract data from form inputs and tables as JSON
  async getData() {
    const formData = {};
    const inputs = this.shadowRoot.querySelectorAll("input, textarea");
    const tables = this.shadowRoot.querySelectorAll("table");

    // Collect non-dynamic input data
    for (const input of inputs) {
      const parentTable = input.closest("table");
      const isDynamicTable =
        parentTable && parentTable.hasAttribute("data-table-id");

      if (!isDynamicTable) {
        if (input.type === "file") {
          const file = input.files[0];
          formData[input.id] = file
            ? await this.#convertFileToBase64(file)
            : "";
        } else if (input.type === "checkbox") {
          const checkboxState = input.getAttribute("data-state");
          formData[input.id] =
            checkboxState === "checked"
              ? true
              : checkboxState === "unchecked"
              ? false
              : null;
        } else {
          formData[input.id] = input.value;
        }
      }
    }

    // Collect dynamic table data
    for (const table of tables) {
      const tableId = table.getAttribute("data-table-id");
      if (tableId) {
        const tableRows = [];
        const rows = table.querySelectorAll("tr");

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const rowData = {};
          const inputsInRow = row.querySelectorAll("input, textarea");

          for (const input of inputsInRow) {
            if (input.type === "file") {
              const file = input.files[0];
              formData[input.id] = file
                ? await this.#convertFileToBase64(file)
                : "";
            } else if (input.type === "checkbox") {
              const checkboxState = input.getAttribute("data-state");
              rowData[input.id] =
                checkboxState === "checked"
                  ? true
                  : checkboxState === "unchecked"
                  ? false
                  : null;
            } else {
              rowData[input.id] = input.value;
            }
          }

          tableRows.push({ [`row-${i}`]: rowData });
        }

        formData[tableId] = tableRows;
      }
    }

    return formData;
  }

  // Convert file to Base64 format
  #convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Render the DOCX file using the docx-preview library
  #renderDocx(file) {
    const container = this.docxContainer;

    const options = {
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      renderHeaders: true,
      renderFooters: true,
      useBase64URL: true,
      debug: true,
      renderFootnotes: true,
      renderEndnotes: true,
    };

    renderAsync(file, container, null, options)
      .then(() => {
        this.#replacePlaceholdersInParagraphs(container); // Replace placeholders in DOCX content
        this.#makeTablesDynamic(container); // Make tables dynamic
        this.generatedHtml = container.innerHTML;

        if (this.jsonDataRestore) {
          this.#applyJsonData();
        }
      })
      .catch((error) => console.error("Error al renderizar el DOCX:", error));
  }

  // Apply JSON data to the form elements in the component
  #applyJsonData() {
    const data = this.jsonDataRestore;

    for (const key in data) {
      const value = data[key];

      const input = this.shadowRoot.querySelector(`#${key}`);
      if (input) {
        if (input.type === "checkbox") {
          const checkboxState =
            value === true
              ? "checked"
              : value === false
              ? "unchecked"
              : "indeterminate";
          input.setAttribute("data-state", checkboxState);
        } else if (input.type === "file") {
          if (value && value.startsWith("data:image")) {
            const uploadIcon = input.nextElementSibling;
            const imgPreview = uploadIcon.nextElementSibling;
            imgPreview.src = value;
            imgPreview.style.display = "block";
            uploadIcon.style.display = "none";
            input.style.display = "none";
          }
        } else {
          input.value = value;
        }
      }
    }

    // Apply data to dynamic tables
    const tables = this.shadowRoot.querySelectorAll("table[data-table-id]");
    tables.forEach((table) => {
      const tableId = table.getAttribute("data-table-id");
      const tableData = data[tableId];

      if (tableData) {
        tableData.forEach((rowData, index) => {
          if (index >= table.rows.length - 1) {
            this.#addRow(table);
          }

          const row = table.rows[index + 1];
          const inputsInRow = row.querySelectorAll("input, textarea");

          let cellIndex = 0;
          inputsInRow.forEach((input) => {
            const cellData = Object.values(rowData[`row-${index + 1}`])[
              cellIndex
            ];

            if (cellData !== undefined) {
              if (input.type === "checkbox") {
                const checkboxState =
                  cellData === true
                    ? "checked"
                    : cellData === false
                    ? "unchecked"
                    : "indeterminate";
                input.setAttribute("data-state", checkboxState);
              } else if (input.type === "file") {
                if (cellData && cellData.startsWith("data:image")) {
                  const uploadIcon = input.nextElementSibling;
                  const imgPreview = uploadIcon.nextElementSibling;
                  imgPreview.src = cellData;
                  imgPreview.style.display = "block";
                  uploadIcon.style.display = "none";
                  input.style.display = "none";
                }
              } else {
                input.value = cellData;
              }

              const originalId = Object.keys(rowData[`row-${index + 1}`])[
                cellIndex
              ];
              input.id = originalId;
            }
            cellIndex++;
          });
        });
      }
    });
  }

  // Replace placeholders in the DOCX content with interactive form elements
  #replacePlaceholdersInParagraphs(container) {
    const paragraphs = container.querySelectorAll("p");

    paragraphs.forEach((paragraph) => {
      let textContent = paragraph.textContent;

      if (textContent.includes("CH1")) {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `checkbox-${this.checkboxCounter}`;
        checkbox.setAttribute("data-state", "unchecked");
        checkbox.addEventListener("click", (event) =>
          this.#handleCheckboxClick(event)
        );
        paragraph.innerHTML = textContent.replace("CH1", "");
        paragraph.appendChild(checkbox);
        this.checkboxCounter++;
      }
      if (textContent.includes("TA1")) {
        const textarea = document.createElement("textarea");
        textarea.rows = 1;
        textarea.cols = 10;
        textarea.id = `textarea-${this.textareaCounter}`;
        paragraph.innerHTML = textContent.replace("TA1", textarea.outerHTML);
        this.textareaCounter++;
      }
      if (textContent.includes("DI1")) {
        const dateInput = document.createElement("input");
        dateInput.type = "date";
        dateInput.id = `date-${this.dateCounter}`;
        paragraph.innerHTML = textContent.replace("DI1", dateInput.outerHTML);
        this.dateCounter++;
      }
      if (textContent.includes("HI1")) {
        const dateInput = document.createElement("input");
        dateInput.type = "time";
        dateInput.id = `time-${this.dateCounter}`;
        paragraph.innerHTML = textContent.replace("HI1", dateInput.outerHTML);
        this.dateCounter++;
      }
      if (textContent.includes("TI1")) {
        const textInput = document.createElement("input");
        textInput.type = "text";
        textInput.id = `text-${this.textCounter}`;
        paragraph.innerHTML = textContent.replace("TI1", textInput.outerHTML);
        this.textCounter++;
      }
      if (textContent.includes("IMG1")) {
        const imgInput = document.createElement("input");
        imgInput.type = "file";
        imgInput.accept = "image/*";
        imgInput.id = `img-${this.imgCounter}`;
        imgInput.style.display = "none";

        const imgPreview = document.createElement("img");
        imgPreview.classList.add("img-preview");
        imgPreview.style.display = "none";

        const uploadIcon = document.createElement("div");
        uploadIcon.classList.add("upload-icon");
        uploadIcon.innerHTML = `<img src="./resources/upload-solid.svg" alt="Cargar imagen" width="30" height="30">`;

        uploadIcon.addEventListener("click", () => imgInput.click());
        imgPreview.addEventListener("click", () => imgInput.click());

        imgInput.addEventListener("change", (event) => {
          this.#previewImage(event, imgPreview);
          uploadIcon.style.display = "none";
        });

        paragraph.innerHTML = textContent.replace("IMG1", "");
        paragraph.appendChild(imgInput);
        paragraph.appendChild(uploadIcon);
        paragraph.appendChild(imgPreview);

        this.imgCounter++;
      }
    });
  }

  // Handle image preview for file inputs
  #previewImage(event, imgPreview) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imgPreview.src = e.target.result;
        imgPreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  }

  // Handle checkbox state changes
  #handleCheckboxClick(event) {
    const checkbox = event.target;
    const currentState = checkbox.getAttribute("data-state");

    if (currentState === "unchecked") {
      checkbox.setAttribute("data-state", "checked");
    } else if (currentState === "checked") {
      checkbox.setAttribute("data-state", "indeterminate");
    } else {
      checkbox.setAttribute("data-state", "unchecked");
    }
  }

  // Make tables dynamic, allowing users to add/remove rows
  #makeTablesDynamic(container) {
    const tables = container.querySelectorAll("table");
    let dynamicTableCounter = 1;

    tables.forEach((table) => {
      if (this.#isDynamicTable(table)) {
        if (!table.hasAttribute("data-table-id")) {
          const tableId = `table-${dynamicTableCounter}`;
          table.setAttribute("data-table-id", tableId);
          dynamicTableCounter++;
        }
        this.#updateLastRowEvent(table);
      }
    });
  }

  // Check if a table is dynamic based on its background color
  #isDynamicTable(table) {
    const firstRow = table.rows[0];
    const backgroundColor = window.getComputedStyle(
      firstRow.cells[0]
    ).backgroundColor;
    return backgroundColor === "rgb(222, 235, 246)";
  }

  // Add events to the last row of the table for dynamic control
  #updateLastRowEvent(table) {
    const rows = table.rows;

    [...rows].forEach((row) => {
      row.removeEventListener("mouseenter", this.#showPopover);
      row.removeEventListener("mouseleave", this.#hidePopoverWithDelay);
    });

    // Asignar eventos solo a la última fila
    const lastRow = rows[rows.length - 1];

    lastRow.addEventListener("mouseenter", (event) =>
      this.#showPopover(event, lastRow, table)
    );
    lastRow.addEventListener("mouseleave", () => {
      this.#hidePopoverWithDelay();
    });
  }

  // Show popover with add/delete row options
  #showPopover(event, row, table) {
    this.#hidePopover();
    const popover = document.createElement("div");
    popover.classList.add("popover", "active");

    const addRowButton = document.createElement("button");
    addRowButton.innerHTML = `<img src="./resources/circle-plus-solid.svg" alt="Añadir fila" width="18" height="18">`;
    addRowButton.title = "Añadir fila";
    addRowButton.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#addRow(table);
    });

    const deleteRowButton = document.createElement("button");
    deleteRowButton.innerHTML = `<img src="./resources/trash-solid.svg" alt="Eliminar fila" width="18" height="18">`;
    deleteRowButton.title = "Eliminar fila";
    deleteRowButton.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#deleteRow(table);
    });

    popover.appendChild(addRowButton);
    popover.appendChild(deleteRowButton);

    this.docxContainer.appendChild(popover);

    const rect = row.getBoundingClientRect();
    popover.style.top = `${rect.top + window.scrollY}px`;
    popover.style.left = `${rect.right + 10}px`;

    this.activePopover = popover;

    popover.addEventListener("mouseenter", () => {
      if (this.hideTimeout) clearTimeout(this.hideTimeout);
    });

    popover.addEventListener("mouseleave", () => {
      this.#hidePopoverWithDelay();
    });
  }

  // Hide the popover with a delay
  #hidePopoverWithDelay() {
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
    this.hideTimeout = setTimeout(() => this.#hidePopover(), 1000);
  }

  // Hide the active popover
  #hidePopover() {
    if (this.activePopover) {
      this.docxContainer.removeChild(this.activePopover);
      this.activePopover = null;
    }
  }

  // Add a new row to the pivot table based on the first row
  #addRow(table) {
    const firstDataRow = table.rows[1]; // First row of data

    const rowCount = table.rows.length;
    const newRow = table.insertRow();
    const uniqueRowId = `row-${rowCount}`;
    newRow.setAttribute("data-row-id", uniqueRowId);

    for (let i = 0; i < firstDataRow.cells.length; i++) {
      const originalCell = firstDataRow.cells[i];
      const newCell = newRow.insertCell(i);

      // Copy the cell content
      newCell.innerHTML = originalCell.innerHTML;

      // Copy the styles from the original cell
      const computedStyle = window.getComputedStyle(originalCell);
      newCell.style.width = computedStyle.width;
      newCell.style.height = computedStyle.height;
      newCell.style.padding = computedStyle.padding;
      newCell.style.textAlign = computedStyle.textAlign;
      newCell.style.verticalAlign = computedStyle.verticalAlign;

      // Reconfigure inputs and other internal elements
      const inputs = newCell.querySelectorAll("input, textarea");
      inputs.forEach((input) => {
        let newId;
        if (input.type === "checkbox") {
          input.checked = false;
          input.setAttribute("data-state", "unchecked");
          newId = `checkbox-${this.checkboxCounter++}`;
          input.addEventListener("click", (event) =>
            this.#handleCheckboxClick(event)
          );
        } else if (input.type === "text") {
          newId = `text-${this.textCounter++}`;
        } else if (input.type === "date") {
          newId = `date-${this.dateCounter++}`;
        } else if (input.type === "time") {
          newId = `time-${this.timeCounter++}`;
        } else if (input.type === "file") {
          const newFileInput = document.createElement("input");
          newFileInput.type = "file";
          newFileInput.accept = "image/*";
          newFileInput.style.display = "none";

          const imgPreview = document.createElement("img");
          imgPreview.classList.add("img-preview");
          imgPreview.style.display = "none";
          imgPreview.src = "";

          const uploadIcon = document.createElement("div");
          uploadIcon.classList.add("upload-icon");
          uploadIcon.innerHTML = `<img src="./resources/upload-solid.svg" alt="Cargar imagen" width="30" height="30">`;

          uploadIcon.addEventListener("click", () => newFileInput.click());
          imgPreview.addEventListener("click", () => newFileInput.click());

          newFileInput.addEventListener("change", (event) => {
            this.#previewImage(event, imgPreview);
            imgPreview.style.display = "block";
            uploadIcon.style.display = "none";
          });

          newCell.innerHTML = "";
          newCell.appendChild(newFileInput);
          newCell.appendChild(uploadIcon);
          newCell.appendChild(imgPreview);

          newId = `img-${this.imgCounter++}`;
          newFileInput.id = newId;
        } else if (input.tagName.toLowerCase() === "textarea") {
          newId = `textarea-${this.textareaCounter++}`;
        }
        input.id = newId;
      });
    }

    this.#updateLastRowEvent(table);
  }

  // Delete the last row of the dynamic table
  #deleteRow(table) {
    const rowCount = table.rows.length;
    if (rowCount > 2) {
      table.deleteRow(rowCount - 1);
      this.#updateLastRowEvent(table);
    } else {
      alert("No se pueden eliminar todas las filas.");
    }
  }
}

// Register the custom Web Component
customElements.define(
  "docx-to-html-interactive",
  DocxToHtmlInteractiveComponent
);
