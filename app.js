document.addEventListener('DOMContentLoaded', () => {
    // --- 1. REFERENCIAS GLOBALES ---
    const searchInput = document.getElementById('searchInput');
    const filtersContainer = document.getElementById('catalogo');
    const grid = document.getElementById('catalogGrid');
    const cardAddNew = document.getElementById('cardAddNew');
    
    // Referencias de Modales y Formulario
    const addModal = document.getElementById('addModal');
    const btnOpenAddModal = document.getElementById('btnOpenAddModal');
    const closeAddModalEls = document.querySelectorAll('.close-add-modal');
    const addPrintableForm = document.getElementById('addPrintableForm');
    const newCategorySelect = document.getElementById('newCategory');

    // Referencias de Vista Previa e Impresión
    const previewModal = document.getElementById('previewModal');
    const modalIframe = document.getElementById('modalIframe');
    const modalTitle = document.getElementById('modalTitle');
    const modalOpenBtn = document.getElementById('modalOpenBtn');
    const modalPrintBtn = document.getElementById('modalPrintBtn');
    const printIframe = document.getElementById('printIframe');


    // --- 2. FUNCIONES DE MODALES ---
    const openPreviewModal = (url, title) => {
        modalTitle.textContent = title;
        modalIframe.src = url;
        modalOpenBtn.href = url;
        
        previewModal.classList.add('active');
        previewModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; 
    };

    const closePreviewModal = () => {
        previewModal.classList.remove('active');
        previewModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        setTimeout(() => { modalIframe.src = ''; }, 250); 
    };

    const closeAddModal = () => {
        addModal.classList.remove('active');
        addModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        addPrintableForm.reset();
    };


    // --- 3. LÓGICA DE FILTROS ---
    const filterCards = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const activeBtn = document.querySelector('.filter-btn.active:not(.btn-add-filter)');
        const activeFilter = activeBtn ? activeBtn.dataset.filter : 'all';
        const cards = document.querySelectorAll('.card');

        cards.forEach(card => {
            const title = card.querySelector('.card-title').textContent.toLowerCase();
            const desc = card.querySelector('.card-desc').textContent.toLowerCase();
            const matchesSearch = title.includes(searchTerm) || desc.includes(searchTerm);

            if (card.dataset.alwaysShow === 'true') {
                card.style.display = (matchesSearch || searchTerm === '') ? 'flex' : 'none';
                return;
            }

            const category = card.dataset.category;
            const matchesCategory = activeFilter === 'all' || category === activeFilter;

            if (matchesSearch && matchesCategory) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    };

    searchInput.addEventListener('input', filterCards);

    const bindFilterEvents = () => {
        document.querySelectorAll('.filter-btn:not(.btn-add-filter)').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true)); 
        });

        document.querySelectorAll('.filter-btn:not(.btn-add-filter)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn:not(.btn-add-filter)').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                filterCards();
            });
        });
    };
    bindFilterEvents();


    // --- 4. AGREGAR NUEVO FILTRO ---
    const btnNuevoFiltro = document.getElementById('btnNuevoFiltro');

    btnNuevoFiltro.addEventListener('click', () => {
        const nuevoFiltro = prompt('Ingresa el nombre del nuevo filtro/categoría (ej. Finanzas):');
        
        if (nuevoFiltro && nuevoFiltro.trim() !== '') {
            const idFiltro = nuevoFiltro.toLowerCase().replace(/\s+/g, '-');
            
            const newBtn = document.createElement('button');
            newBtn.className = 'filter-btn';
            newBtn.dataset.filter = idFiltro;
            newBtn.textContent = nuevoFiltro;
            
            filtersContainer.insertBefore(newBtn, btnNuevoFiltro);
            
            const newOption = document.createElement('option');
            newOption.value = idFiltro;
            newOption.textContent = nuevoFiltro;
            newCategorySelect.appendChild(newOption);
            
            bindFilterEvents();
            newBtn.click();
        }
    });


    // --- 5. LÓGICA DE GUARDADO LOCAL (LOCALSTORAGE) Y SUBIDA ---
    const CUSTOM_ITEMS_KEY = 'estudio_imprimible_items';
    let customItems = JSON.parse(localStorage.getItem(CUSTOM_ITEMS_KEY)) || [];

    const readFileAsDataURL = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    };

    const renderCustomCard = (item) => {
        const newCard = document.createElement('article');
        newCard.className = 'card';
        newCard.dataset.category = item.categoryValue;
        newCard.dataset.id = item.id;
        
        newCard.innerHTML = `
            <div class="card-preview" style="background-image: url('${item.imageBg}'); background-size: cover; background-position: center; border-bottom: 1px solid var(--border); position: relative;">
                <div class="preview-badge" style="background: var(--accent); color: white; border: none;">Nuevo</div>
                <button class="btn-delete" title="Borrar plantilla" style="position: absolute; top: 10px; left: 10px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">🗑️</button>
            </div>
            <div class="card-body">
                <span class="card-tag">${item.categoryText}</span>
                <h2 class="card-title">${item.title}</h2>
                <p class="card-desc">Archivo personalizado subido por el usuario.</p>
                <div class="card-footer">
                    <button class="btn btn-outline btn-preview">👁️ Vista Previa</button>
                    <button class="btn btn-primary btn-print-direct">🖨️ Imprimir</button>
                </div>
            </div>
        `;
        
        grid.insertBefore(newCard, cardAddNew);
        
        // Evento: Vista Previa (Item Personalizado)
        newCard.querySelector('.btn-preview').addEventListener('click', () => {
            openPreviewModal(item.fileData, item.title);
        });

        // Evento: Imprimir (Item Personalizado)
        newCard.querySelector('.btn-print-direct').addEventListener('click', () => {
            printIframe.src = item.fileData;
            printIframe.onload = () => {
                setTimeout(() => {
                    printIframe.contentWindow.focus();
                    printIframe.contentWindow.print();
                }, 300);
            };
        });

        // Evento: Borrar
        newCard.querySelector('.btn-delete').addEventListener('click', () => {
            if(confirm('¿Estás seguro de que deseas eliminar esta plantilla permanentemente?')) {
                newCard.remove(); 
                customItems = customItems.filter(i => i.id !== item.id);
                localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(customItems));
            }
        });
    };

    // Cargar los items guardados al iniciar
    customItems.forEach(item => renderCustomCard(item));

    // Abrir modal de subida
    btnOpenAddModal.addEventListener('click', () => {
        addModal.classList.add('active');
        addModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    });

    closeAddModalEls.forEach(el => el.addEventListener('click', closeAddModal));

    // Procesar formulario
    addPrintableForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('newTitle').value;
        const categoryValue = document.getElementById('newCategory').value;
        const categoryText = newCategorySelect.options[newCategorySelect.selectedIndex].text;
        
        const imageFile = document.getElementById('newImage').files[0];
        const docFile = document.getElementById('newFile').files[0];
        
        if (!docFile.name.toLowerCase().endsWith('.pdf') && !docFile.name.toLowerCase().endsWith('.html')) {
            alert("Atención: Para que el botón 'Imprimir' funcione directamente, se recomienda subir archivos .PDF. Otros formatos podrían descargarse en lugar de imprimirse.");
        }

        try {
            const submitBtn = addPrintableForm.querySelector('[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Guardando...';
            submitBtn.disabled = true;

            const imageBase64 = await readFileAsDataURL(imageFile);
            const docBase64 = await readFileAsDataURL(docFile);

            const newItem = {
                id: Date.now().toString(),
                title: title,
                categoryValue: categoryValue,
                categoryText: categoryText,
                imageBg: imageBase64,
                fileData: docBase64
            };

            customItems.push(newItem);
            
            try {
                localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(customItems));
            } catch(storageError) {
                alert("Error de memoria: El archivo es demasiado pesado para guardarlo en el navegador. Intenta con un PDF o imagen más ligera.");
                customItems.pop();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                return;
            }

            renderCustomCard(newItem);
            closeAddModal();
            filterCards(); 
            
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

        } catch (error) {
            console.error("Error al procesar los archivos:", error);
            alert("Hubo un error al leer los archivos.");
        }
    });


    // --- 6. EVENTOS GENERALES (ÍTEMS ORIGINALES Y MODALES) ---
    
    // Vista previa de items cargados en el HTML original
    document.querySelectorAll('.card:not([data-id]) .btn-preview').forEach(btn => {
        btn.addEventListener('click', () => {
            openPreviewModal(btn.dataset.target, btn.dataset.title || 'Vista Previa');
        });
    });

    // Imprimir items cargados en el HTML original
    document.querySelectorAll('.card:not([data-id]) .btn-print-direct').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetUrl = btn.dataset.target;
            if (!targetUrl) return;
            printIframe.src = targetUrl;
            printIframe.onload = () => {
                setTimeout(() => {
                    printIframe.contentWindow.focus();
                    printIframe.contentWindow.print();
                }, 300);
            };
        });
    });

    // Cerrar modales
    document.querySelectorAll('#modalClose, #modalCloseBtn, #modalOverlay').forEach(el => {
        el.addEventListener('click', closePreviewModal);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (previewModal.classList.contains('active')) closePreviewModal();
            if (addModal.classList.contains('active')) closeAddModal();
        }
    });

    // Imprimir desde el modal de vista previa
    modalPrintBtn.addEventListener('click', () => {
        if (modalIframe.contentWindow) {
            modalIframe.contentWindow.focus();
            modalIframe.contentWindow.print();
        } else {
            window.open(modalIframe.src, '_blank');
        }
    });
});