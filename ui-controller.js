// ui-controller.js
(function() {
    const AVAILABLE_LEVELS = [
        { id: '0', label: 'Level 0' },
        { id: '0.3', label: 'Level 0.3', parent: '0' },
        { id: '0.35', label: 'Level 0.35', parent: '0' },
        { id: '0.5', label: 'Level 0.5', parent: '0' },                
        { id: '0.7', label: 'Level 0.7', parent: '0' },
        { id: '0.775', label: 'Level 0.775', parent: '0' },
        { id: '1', label: 'Level 1' },
        { id: '1.0090', label: 'Level 1.0090', parent: '1'},
    ];

    const sidebar = document.querySelector('.sidebar');
    const levelGroupContainer = document.querySelector('.level-btn-group');

    let currentActiveLevel = '0';

    function getRootParentId(levelId) {
        const levelObj = AVAILABLE_LEVELS.find(lvl => lvl.id === levelId);
        return levelObj?.parent || levelObj?.id || levelId;
    }

    function updateSidebar(data) {
        if (!sidebar) return;

        const titleEl = sidebar.querySelector('.sidebar-title');
        const descEl = sidebar.querySelector('.sidebar-desc');
        const trelloContainer = sidebar.querySelector('.sidebar-trello-wrapper');

        if (titleEl) titleEl.textContent = data.name || 'Unknown Location';
        if (descEl) descEl.textContent = data.description || 'No description provided.';

        if (trelloContainer) {
            trelloContainer.innerHTML = '';

            if (data.trelloUrl) {
                const quote = document.createElement('blockquote');
                quote.className = 'trello-card';

                const link = document.createElement('a');
                link.href = data.trelloUrl;
                link.textContent = 'Trello Card';

                quote.appendChild(link);
                trelloContainer.appendChild(quote);

                if (window.TrelloCards) {
                    window.TrelloCards.load(trelloContainer);
                }
            }
        }
    }

    function renderLevelButtons() {
        if (!levelGroupContainer) return;

        levelGroupContainer.innerHTML = '';

        const activeRoot = getRootParentId(currentActiveLevel);

        const visibleLevels = AVAILABLE_LEVELS.filter(lvl => {
            if (!lvl.parent) return true;
            return lvl.parent === activeRoot;
        });

        visibleLevels.forEach((lvl) => {
            const btn = document.createElement('button');
            const isActive = lvl.id === currentActiveLevel;
            const isSublevel = Boolean(lvl.parent);

            btn.className = `ui-level-btn ${isActive ? 'active' : ''} ${isSublevel ? 'sub-level-btn' : ''}`;
            btn.setAttribute('data-level', lvl.id);
            btn.textContent = lvl.label;

            btn.addEventListener('click', () => {
                currentActiveLevel = lvl.id;

                if (window.MapOverlay?.loadLevel) {
                    window.MapOverlay.loadLevel(lvl.id);
                }

                renderLevelButtons();
            });

            levelGroupContainer.appendChild(btn);
        });
    }

    renderLevelButtons();

    window.MapUI = {
        updateSidebar
    };
})();