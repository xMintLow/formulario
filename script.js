document.addEventListener('DOMContentLoaded', () => {
    const clientNameInput = document.getElementById('clientName');
    const productsGrid = document.querySelector('.products-grid');
    const selectedProductsList = document.getElementById('selectedProductsList');
    const totalPriceDisplay = document.getElementById('totalPrice');
    const generatePdfButton = document.getElementById('generatePdf');
    const clearInventoryButton = document.getElementById('clearInventory');

    let selectedProducts = [];

    // URL de tu logo. Asegúrate de que 'logo.png' esté en la misma carpeta que tu HTML.
    // Si prefieres usar una imagen Base64 para incrustarla directamente y evitar problemas de carga,
    // puedes convertir tu imagen a Base64 y pegarla aquí. Por ejemplo:
    // const HEADER_IMAGE_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...';
    const HEADER_IMAGE_URL = 'logo.png'; 

    // Función para calcular y actualizar el precio total en la interfaz
    const updateTotalPrice = () => {
        let total = 0;
        selectedProducts.forEach(product => {
            total += product.price * product.quantity;
        });
        totalPriceDisplay.textContent = `$${total.toFixed(2)}`;
    };

    // Función para renderizar los productos seleccionados en la interfaz
    const renderSelectedProducts = () => {
        selectedProductsList.innerHTML = '';
        if (selectedProducts.length === 0) {
            selectedProductsList.innerHTML = '<li style="text-align: center; color: #777;">No has seleccionado ningún producto aún.</li>';
        } else {
            selectedProducts.forEach(product => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <div class="product-details">
                        <strong>${product.name}</strong> (x${product.quantity}) - $${(product.price * product.quantity).toFixed(2)}
                    </div>
                    <div class="remove-controls">
                        <input type="number" value="1" min="1" max="${product.quantity}" class="remove-quantity" data-product-id="${product.id}">
                        <button class="remove-product-btn" data-product-id="${product.id}">Eliminar</button>
                    </div>
                `;
                selectedProductsList.appendChild(listItem);
            });
        }
        updateTotalPrice();
    };

    // Agregar producto al inventario seleccionado
    productsGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart')) {
            const productCard = e.target.closest('.product-card');
            const productId = productCard.dataset.id;
            const productName = productCard.dataset.name;
            const productPrice = parseFloat(productCard.dataset.price);
            const quantityInput = productCard.querySelector('.product-quantity');
            let quantityToAdd = parseInt(quantityInput.value, 10);

            if (isNaN(quantityToAdd) || quantityToAdd < 1) {
                alert('Por favor, ingresa una cantidad válida (mínimo 1) para agregar.');
                return;
            }

            const existingProductIndex = selectedProducts.findIndex(p => p.id === productId);

            if (existingProductIndex > -1) {
                selectedProducts[existingProductIndex].quantity += quantityToAdd;
            } else {
                selectedProducts.push({
                    id: productId,
                    name: productName,
                    price: productPrice,
                    quantity: quantityToAdd
                });
            }

            renderSelectedProducts();
            quantityInput.value = 1; // Restablecer la cantidad a 1 después de agregar
        }
    });

    // Eliminar producto del inventario seleccionado (o una cantidad específica)
    selectedProductsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-product-btn')) {
            const productIdToRemove = e.target.dataset.productId;
            const productToRemoveIndex = selectedProducts.findIndex(p => p.id === productIdToRemove);

            if (productToRemoveIndex === -1) return;

            const removeQuantityInput = e.target.closest('.remove-controls').querySelector('.remove-quantity');
            let quantityToRemove = parseInt(removeQuantityInput.value, 10);

            if (isNaN(quantityToRemove) || quantityToRemove < 1) {
                alert('Por favor, ingresa una cantidad válida (mínimo 1) para eliminar.');
                return;
            }

            if (quantityToRemove >= selectedProducts[productToRemoveIndex].quantity) {
                selectedProducts.splice(productToRemoveIndex, 1);
            } else {
                selectedProducts[productToRemoveIndex].quantity -= quantityToRemove;
            }

            renderSelectedProducts();
        }
    });

    // Vaciar todo el inventario seleccionado
    clearInventoryButton.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres vaciar todo tu inventario?')) {
            selectedProducts = [];
            renderSelectedProducts();
            alert('Inventario vaciado.');
        }
    });

    // Generar PDF del inventario
    generatePdfButton.addEventListener('click', async () => {
        const clientName = clientNameInput.value.trim();

        if (clientName === '') {
            alert('Por favor, ingresa el nombre del cliente antes de generar el PDF.');
            return;
        }

        if (selectedProducts.length === 0) {
            alert('Por favor, selecciona al menos un producto para generar el PDF.');
            return;
        }

        // Es crucial que 'jspdf-autotable' se cargue ANTES de este script
        // Asegúrate de tener la línea:
        // <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js"></script>
        // en tu HTML, justo después de la de jspdf.
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // --- Estilos generales del PDF ---
        const primaryColor = '#2c3e50'; // Un azul oscuro para textos principales
        const accentColor = '#3498db'; // Un azul más claro para detalles
        const lightGray = '#f0f0f0'; // Fondo ligero para secciones
        const darkerGray = '#666666'; // Para texto secundario
        const headerHeight = 40; // Altura del encabezado
        const footerHeight = 15; // Altura aproximada del pie de página

        // --- Encabezado mejorado ---
        doc.setFillColor(lightGray);
        doc.rect(0, 0, doc.internal.pageSize.getWidth(), headerHeight, 'F'); // Fondo claro para el encabezado

        // Título principal
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(primaryColor);
        doc.text('Inventario de Equipos Tecnológicos', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

        // Detalles de la empresa (puedes personalizarlos)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(darkerGray);
        doc.text('TecLaner S.A.C. | RUC: 20011784235', doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
        doc.text('Calle Liberal 123, Lima, Perú', doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });

        // Logo en el encabezado
        try {
            const img = new Image();
            img.src = HEADER_IMAGE_URL;

            await new Promise((resolve, reject) => {
                img.onload = () => {
                    const imgWidth = 30; // Ancho del logo
                    const imgHeight = (img.height * imgWidth) / img.width; // Mantener proporción
                    doc.addImage(img, 'PNG', 10, 5, imgWidth, imgHeight); // Posición del logo (izq)
                    resolve();
                };
                img.onerror = reject;
            });
        } catch (error) {
            console.error('Error cargando la imagen para el PDF:', error);
            // alert('No se pudo cargar la imagen del encabezado. Generando PDF sin imagen.'); // Opcional: notificar al usuario
        }

        let yPos = headerHeight + 10; // Posición inicial después del encabezado

        // Información del cliente y fecha
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(accentColor);
        doc.text(`Cliente: ${clientName}`, 15, yPos);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(darkerGray);
        const currentDate = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        doc.text(`Fecha de Inventario: ${currentDate}`, doc.internal.pageSize.getWidth() - 15, yPos, { align: 'right' });
        yPos += 15;

        // --- Tabla de inventario ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(primaryColor);
        doc.text('Detalle de Productos Seleccionados', 15, yPos);
        yPos += 10;

        const tableColumn = ["#", "Producto", "Cantidad", "Precio Unitario", "Subtotal"];
        const tableRows = [];
        let totalInventario = 0;

        selectedProducts.forEach((product, index) => {
            const itemSubtotal = product.price * product.quantity;
            tableRows.push([
                index + 1,
                product.name,
                product.quantity,
                `$${product.price.toFixed(2)}`,
                `$${itemSubtotal.toFixed(2)}`
            ]);
            totalInventario += itemSubtotal;
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: yPos,
            theme: 'striped', 
            headStyles: {
                fillColor: accentColor,
                textColor: '#ffffff',
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                textColor: primaryColor
            },
            alternateRowStyles: {
                fillColor: '#f9f9f9'
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 15 },
                1: { halign: 'left' },
                2: { halign: 'center', cellWidth: 25 },
                3: { halign: 'right', cellWidth: 30 },
                4: { halign: 'right', fontStyle: 'bold', cellWidth: 30 }
            },
            margin: { top: headerHeight + 5, bottom: footerHeight + 5 }, // Ajusta los márgenes para encabezado y pie
            didDrawPage: function (data) {
                // Dibujar encabezado en páginas subsiguientes
                if (data.pageNumber > 1) {
                    doc.setFillColor(lightGray);
                    doc.rect(0, 0, doc.internal.pageSize.getWidth(), headerHeight, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(18);
                    doc.setTextColor(primaryColor);
                    doc.text('Inventario de Equipos Tecnológicos', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    doc.setTextColor(darkerGray);
                    doc.text('TecLaner S.A.C. | RUC: 20XXXXXXXXX', doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
                    // No se añade el logo en páginas subsiguientes para no recargarlo
                }

                // Pie de página en cada página
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(darkerGray);
                const footerText = `Generado por TecLaner | Contacto: TecLaner@empresa.com | Página ${data.pageNumber} de ${doc.internal.getNumberOfPages()}`;
                doc.text(footerText, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
            }
        });

        // Actualizar yPos después de la tabla para el total y notas
        yPos = doc.autoTable.previous.finalY + 15;

        // Total estimado (fuera de la tabla para mayor destaque)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(primaryColor);
        doc.text(`Total estimado: $${totalInventario.toFixed(2)}`, doc.internal.pageSize.getWidth() - 15, yPos, { align: 'right' });
        yPos += 10;

        // Notas adicionales / Disclaimer
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(darkerGray);
        doc.text('Nota: Este es un inventario estimado y puede no incluir todos los costos asociados (ej. envío, instalación).', 15, yPos);
        yPos += 5;
        doc.text('Para un presupuesto final, contacte a su asesor de ventas.', 15, yPos);
        
        doc.save(`Inventario_${clientName.replace(/\s/g, '_')}_${currentDate}.pdf`);
        alert('PDF generado exitosamente.');
    });

    // Inicializar la lista de productos seleccionados y el total al cargar la página
    renderSelectedProducts();
});