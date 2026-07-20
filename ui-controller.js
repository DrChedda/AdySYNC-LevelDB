(function() {
    const AVAILABLE_LEVELS = [0]; 

    const sidebar = document.querySelector('.ui-info-sidebar');
    const closeBtn = document.querySelector('.sidebar-close-btn') || document.querySelector('#closeSidebar');
    const levelGroupContainer = document.querySelector('.level-btn-group');

    function closeSidebar() {
        if (sidebar) {
            sidebar.classList.remove('open');
        }
    }

    function openSidebarWithData(data) {
        if (!sidebar) return;

        const titleEl = sidebar.querySelector('.sidebar-title');
        const descEl = sidebar.querySelector('.sidebar-desc');
        const trelloContainer = sidebar.querySelector('.sidebar-trello-wrapper');

        if (titleEl) titleEl.textContent = data.name || 'Unknown Location';
        if (descEl) descEl.textContent = data.description || 'No detailed records available.';

        if (trelloContainer) {
            trelloContainer.innerHTML = '';
            if (data.trelloUrl) {
                const link = document.createElement('a');
                link.href = data.trelloUrl;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.className = 'trello-embed-link';
                link.textContent = 'OPEN TRELLO BOARD';
                trelloContainer.appendChild(link);
            }
        }

        sidebar.classList.add('open');
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeSidebar();
        });
    }

    function renderLevelButtons() {
        if (!levelGroupContainer) return;

        levelGroupContainer.innerHTML = '';

        AVAILABLE_LEVELS.forEach((levelNum, index) => {
            const btn = document.createElement('button');
            btn.className = `ui-level-btn ${index === 0 ? 'active' : ''}`;
            btn.setAttribute('data-level', levelNum);
            btn.textContent = `Level ${levelNum}`;

            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.ui-level-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                if (window.MapOverlay?.loadLevel) {
                    window.MapOverlay.loadLevel(levelNum);
                }
            });

            levelGroupContainer.appendChild(btn);
        });
    }

    renderLevelButtons();

    window.MapUI = {
        openSidebarWithData,
        closeSidebar
    };
})();