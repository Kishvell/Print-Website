document.addEventListener('DOMContentLoaded', () => {
    // Referencias Globales
    const searchInput = document.getElementById('searchInput');
    const filtersContainer = document.getElementById('catalogo');
    const grid = document.getElementById('catalogGrid');
    const cardAddNew = document.getElementById('cardAddNew');
    
    // --- LÓGICA DE FILTROS ---
    const filterCards = () => {
        const searchTerm = searchInput.value.toLowerCase();
        // Obtener el filtro activo excluyendo el botón de agregar
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

    // Bind initial filter buttons
    const bindFilterEvents = () => {
        document.querySelectorAll('.filter-btn:not(.btn-add-filter)').forEach(btn => {
            // Eliminar listeners previos para evitar duplicados al agregar nuevos
            btn.replaceWith(btn.cloneNode(true)); 
        });

        // Re-asignar eventos
        document.querySelectorAll('.filter-btn:not(.btn-add-filter)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn:not(.btn-add-filter)').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                filterCards();
            });
        });
    };
    
    bindFilterEvents();

    // --- AGREGAR NUEVO FILTRO ---
    const btnNuevoFiltro = document.getElementById('btnNuevoFiltro');
    const newCategorySelect = document.getElementById('newCategory');

    btnNuevoFiltro.addEventListener('click', () => {
        const nuevoFiltro = prompt('Ingresa el nombre del nuevo filtro/categoría (ej. Finanzas):');
        
        if (nuevoFiltro && nuevoFiltro.trim() !== '') {
            const idFiltro = nuevoFiltro.toLowerCase().replace(/\s+/g, '-');
            
            // 1. Crear el botón de filtro visual
            const newBtn = document.createElement('button');
            newBtn.className = 'filter-btn';
            newBtn.dataset.filter = idFiltro;
            newBtn.textContent = nuevoFiltro;
            
            filtersContainer.insertBefore(newBtn, btnNuevoFiltro);
            
            // 2. Agregarlo a las opciones del formulario
            const newOption = document.createElement('option');
            newOption.value = idFiltro;
            newOption.textContent = nuevoFiltro;
            newCategorySelect.appendChild(newOption);
            
            // 3. Re-vincular eventos
            bindFilterEvents();
            
            // Seleccionarlo automáticamente
            newBtn.click();
        }
    });

    // --- MODAL DE SUBIR PLANTILLA ---
    const addModal = document.getElementById('addModal');
    const btnOpenAddModal = document.getElementById('btnOpenAddModal');
    const closeAddModalEls = document.querySelectorAll('.close-add-modal');
    const addPrintableForm = document.getElementById('addPrintableForm');

    btnOpenAddModal.addEventListener('click', () => {
        addModal.classList.add('active');
        addModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    });

    const closeAddModal = () => {
        addModal.classList.remove('active');
        addModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        addPrintableForm.reset();
    };

    closeAddModalEls.forEach(el => el.addEventListener('click', closeAddModal));

    // Procesar el Formulario y Crear la Tarjeta
    addPrintableForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('newTitle').value;
        const categoryValue = document.getElementById('newCategory').value;
        const categoryText = newCategorySelect.options[newCategorySelect.selectedIndex].text;
        
        const imageFile = document.getElementById('newImage').files[0];
        const docFile = document.getElementById('newFile').files[0];
        
        // Crear URLs locales temporales para mostrar la imagen y el archivo
        const imageUrl = URL.createObjectURL(imageFile);
        const docUrl = URL.createObjectURL(docFile);

        // Crear la nueva tarjeta en el HTML
        const newCard = document.createElement('article');
        newCard.className = 'card';
        newCard.dataset.category = categoryValue;
        
        newCard.innerHTML = `
            <div class="card-preview" style="background-image: url('${imageUrl}'); background-size: cover; background-position: center; border-bottom: 1px solid var(--border);">
                <div class="preview-badge" style="background: var(--accent); color: white; border: none;">Nuevo</div>
            </div>
            <div class="card-body">
                <span class="card-tag">${categoryText}</span>
                <h2 class="card-title">${title}</h2>
                <p class="card-desc">Archivo local: ${docFile.name}</p>
                <div class="card-footer">
                    <button class="btn btn-outline btn-preview" data-target="${docUrl}" data-title="${title}">👁️ Vista Previa</button>
                    <a href="${docUrl}" download="${docFile.name}" class="btn btn-primary" style="display:flex; justify-content:center; align-items:center;">💾 Descargar</a>
                </div>
            </div>
        `;
        
        // Insertar antes de la tarjeta "Agregar Nuevo"
        grid.insertBefore(newCard, cardAddNew);
        
        // Asignar el evento al nuevo botón de Vista Previa
        const newPreviewBtn = newCard.querySelector('.btn-preview');
        newPreviewBtn.addEventListener('click', () => {
            openPreviewModal(docUrl, title);
        });

        closeAddModal();
        filterCards(); // Refrescar vista
    });

    // --- MODAL DE VISTA PREVIA & IMPRESIÓN ---
    const previewModal = document.getElementById('previewModal');
    const modalIframe = document.getElementById('modalIframe');
    const modalTitle = document.getElementById('modalTitle');
    const modalOpenBtn = document.getElementById('modalOpenBtn');
    const modalPrintBtn = document.getElementById('modalPrintBtn');
    const printIframe = document.getElementById('printIframe');

    const openPreviewModal = (url, title) => {
        modalTitle.textContent = title;
        modalIframe.src = url;
        modalOpenBtn.href = url;
        
        previewModal.classList.add('active');
        previewModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; 
    };

    // Vincular Vista Previa a los botones existentes
    document.querySelectorAll('.btn-preview').forEach(btn => {
        btn.addEventListener('click', () => {
            openPreviewModal(btn.dataset.target, btn.dataset.title || 'Vista Previa');
        });
    });

    const closePreviewModal = () => {
        previewModal.classList.remove('active');
        previewModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        setTimeout(() => { modalIframe.src = ''; }, 250); 
    };

    document.querySelectorAll('#modalClose, #modalCloseBtn, #modalOverlay').forEach(el => {
        el.addEventListener('click', closePreviewModal);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (previewModal.classList.contains('active')) closePreviewModal();
            if (addModal.classList.contains('active')) closeAddModal();
        }
    });

    // Impresión Directa desde Catálogo
    document.querySelectorAll('.btn-print-direct').forEach(btn => {
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

    // Impresión desde Modal
    modalPrintBtn.addEventListener('click', () => {
        if (modalIframe.contentWindow) {
            modalIframe.contentWindow.focus();
            modalIframe.contentWindow.print();
        } else {
            // Fallback si es un PDF que el iframe no deja imprimir directo
            window.open(modalIframe.src, '_blank');
        }
    });
});