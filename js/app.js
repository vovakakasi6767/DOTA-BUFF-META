let currentCategory = "all";
let searchQuery = "";
let selectedHeroId = null;

function getHeroImageUrl(heroObj) {
    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${heroObj.slug}.png`;
}

function getItemImageUrl(itemName) {
    let cleanName = itemName
        .toLowerCase()
        .trim()
        .replace(/'/g, '')
        .replace(/\s+/g, '_');
        
    const exceptions = {
        "manta_style": "manta",
        "skull_basher": "basher",
        "assault_cuirass": "assault",
        "blink_dagger": "blink",
        "refresher_orb": "refresher",
        "daedalus": "greater_crit",
        "linkens_sphere": "sphere",
        "aghanims_scepter": "ultimate_scepter",
        "shadow_blade": "invis_sword",
        "gleipnir": "heavy_crossbow",
        "eye_of_skadi": "skadi",
        "armlet_of_mordiggian": "armlet",
        "black_king_bar": "black_king_bar",
        "shivas_guard": "shivas_guard",
        "euls_scepter_of_divinity": "cyclone",
        "orchid_malevolence": "orchid",
        "urn_of_shadows": "urn_of_shadows",
        "scythe_of_vyse": "sheepstick",
        "heart_of_tarrasque": "heart",
        "pipe_of_insight": "pipe"
    };

    if (exceptions[cleanName]) {
        cleanName = exceptions[cleanName];
    }

    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${cleanName}.png`;
}

function getFilteredHeroes() {
    let heroes = [...heroesDatabase];
    if (currentCategory !== "all") {
        heroes = heroes.filter(hero => hero.role === currentCategory);
    }
    if (searchQuery.trim() !== "") {
        heroes = heroes.filter(hero => 
            hero.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    heroes.sort((a, b) => parseFloat(b.winrate) - parseFloat(a.winrate));
    return heroes;
}

function renderHeroList() {
    const container = document.getElementById('heroListContainer');
    if (!container) return;
    const filtered = getFilteredHeroes();
    container.innerHTML = '';

    if (filtered.length === 0) {
        container.innerHTML = `<tr><td colspan="2" style="text-align:center; padding: 20px; color:#5d738c; font-size:0.85rem;">Герои не найдены</td></tr>`;
        return;
    }

    filtered.forEach(hero => {
        const tr = document.createElement('tr');
        tr.className = `db-row ${selectedHeroId === hero.id ? 'active' : ''}`;
        
        const parsedWinrate = parseFloat(hero.winrate);
        const barWidth = Math.max(30, Math.min(100, (parsedWinrate - 40) * 4)); 
        const roleLabels = { carry: 'Керри', offlane: 'Хардлайн', mid: 'Мид', support: 'Саппорт' };

        tr.innerHTML = `
            <td class="db-cell">
                <div class="hero-info-box">
                    <img class="hero-avatar-img" src="${getHeroImageUrl(hero)}" alt="${hero.name}" onerror="this.src='https://cdn.cloudflare.com/apps/dota2/images/dota_react/heroes/default.png'">
                    <div>
                        <span class="hero-title-main">${hero.name}</span>
                        <span class="hero-role-sub">${roleLabels[hero.role]}</span>
                    </div>
                </div>
            </td>
            <td class="db-cell" style="text-align: right;">
                <div class="winrate-container" style="margin-left: auto;">
                    <span class="winrate-value">${hero.winrate}</span>
                    <div class="winrate-bar-bg">
                        <div class="winrate-bar-fill" style="width: ${barWidth}%;"></div>
                    </div>
                </div>
            </td>
        `;

        tr.addEventListener('click', () => {
            selectedHeroId = hero.id;
            renderHeroDetails(hero.id);
            renderHeroList();
        });

        container.appendChild(tr);
    });
}

function generateInteractiveBadges(namesArray, isSynergy = false) {
    return namesArray.map(heroName => {
        const found = heroesDatabase.find(h => h.name.toLowerCase() === heroName.toLowerCase());
        const typeClass = isSynergy ? "synergy" : "counter";
        
        if (found) {
            return `
                <span class="db-badge clickable ${typeClass}" onclick="selectHeroDirectly('${found.id}')" title="Открыть аналитику героя">
                    <img src="${getHeroImageUrl(found)}" alt="${found.name}">
                    <span>${found.name}</span>
                </span>
            `;
        } else {
            const mockSlug = heroName.toLowerCase().replace(/\s+/g, '_').replace(/'/g, '');
            return `
                <span class="db-badge ${typeClass}">
                    <img src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${mockSlug}.png" onerror="this.style.display='none'">
                    <span>${heroName}</span>
                </span>
            `;
        }
    }).join('');
}

function renderHeroDetails(heroId) {
    const hero = heroesDatabase.find(h => h.id === heroId);
    if (!hero) return;

    const detailHeader = document.getElementById('detailHeroName');
    if (detailHeader) {
        detailHeader.innerHTML = `
            <div class="hero-detail-header-box">
                <img class="hero-detail-avatar" src="${getHeroImageUrl(hero)}" alt="${hero.name}">
                <span>Статистика по сборкам: ${hero.name}</span>
            </div>
        `;
    }

    const detailContainer = document.getElementById('detailContent');
    if (!detailContainer) return;

    // Проверяем, есть ли у пользователя сборка для этого героя
    const user = JSON.parse(localStorage.getItem('dota_user'));
    let userBuildsHtml = '';
    if (user && user.builds) {
        const userBuilds = user.builds.filter(b => b.heroId === heroId);
        if (userBuilds.length > 0) {
            userBuildsHtml = `
                <div class="section-title">
                    <i class="fas fa-user" style="color: #a9cf46;"></i> Мои сборки для ${hero.name}
                </div>
                ${userBuilds.map(build => `
                    <div style="background: #1c242d; border: 1px solid #2d3b48; border-radius: 6px; padding: 10px; margin-bottom: 10px;">
                        <div style="color: #fff; font-weight: 500; margin-bottom: 6px;">${build.buildName}</div>
                        <div class="items-flex">
                            ${build.items.map(item => `
                                <div class="db-item-card">
                                    <img class="item-icon" src="${getItemImageUrl(item)}" alt="${item}" onerror="this.src='https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/default.png'">
                                    <span>${item}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            `;
        }
    }

    detailContainer.innerHTML = `
        <div class="hero-gameplay-description">
            <strong>Описание:</strong> ${hero.description}
        </div>

        <div class="section-title">Стартовые предметы</div>
        <div class="items-flex">
            ${hero.items.starter.map(item => `
                <div class="db-item-card">
                    <img class="item-icon" src="${getItemImageUrl(item)}" alt="${item}" onerror="this.src='https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/default.png'">
                    <span>${item}</span>
                </div>
            `).join('')}
        </div>

        <div class="section-title">Основные предметы (Core)</div>
        <div class="items-flex">
            ${hero.items.core.map(item => `
                <div class="db-item-card">
                    <img class="item-icon" src="${getItemImageUrl(item)}" alt="${item}" onerror="this.src='https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/default.png'">
                    <span>${item}</span>
                </div>
            `).join('')}
        </div>

        <div class="section-title">Ситуативно</div>
        <div class="items-flex">
            ${hero.items.situational.map(item => `
                <div class="db-item-card">
                    <img class="item-icon" src="${getItemImageUrl(item)}" alt="${item}" onerror="this.src='https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/default.png'">
                    <span>${item}</span>
                </div>
            `).join('')}
        </div>

        ${userBuildsHtml}

        <div class="section-title">Тяжело играть против (Контрпики)</div>
        <div class="badge-list" style="margin-bottom: 15px;">
            ${generateInteractiveBadges(hero.counters, false)}
        </div>

        <div class="section-title">Синергия (Хорош вместе с)</div>
        <div class="badge-list">
            ${generateInteractiveBadges(hero.synergies, true)}
        </div>

        <div class="db-note">
            <i class="fas fa-lightbulb"></i>
            <div><strong>Рекомендации по игре:</strong> ${hero.tips}</div>
        </div>
        
        ${user ? `
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="openBuildModalForHero('${hero.id}')" class="btn-primary" style="display: inline-flex;">
                    <i class="fas fa-plus"></i> Добавить свою сборку для ${hero.name}
                </button>
            </div>
        ` : `
            <div class="db-note" style="border-left-color: #ed3b14;">
                <i class="fas fa-lock" style="color: #ed3b14;"></i>
                <div><a href="pages/login.html" style="color: #a9cf46;">Авторизуйтесь</a>, чтобы создавать свои сборки для этого героя</div>
            </div>
        `}
    `;
}

function openBuildModalForHero(heroId) {
    const modal = document.getElementById('buildModal');
    const body = document.getElementById('buildModalBody');
    const title = document.getElementById('buildModalTitle');
    
    const hero = heroesDatabase.find(h => h.id === heroId);
    title.innerHTML = `<i class="fas fa-hammer"></i> Создать сборку для ${hero ? hero.name : 'героя'}`;
    
    body.innerHTML = `
        <div class="build-form">
            <form id="buildForm" onsubmit="submitBuildFromHero(event, '${heroId}')">
                <div class="build-form-group">
                    <label>Герой</label>
                    <input type="text" value="${hero ? hero.name : ''}" disabled style="width: 100%; background: #1c242d; border: 2px solid #334352; color: #8091a5; padding: 10px 15px; border-radius: 6px;">
                </div>
                <div class="build-form-group">
                    <label for="buildNameInputHero">Название сборки</label>
                    <input type="text" id="buildNameInputHero" placeholder="Например: Моя ультимативная сборка" required>
                </div>
                <div class="build-form-group">
                    <label for="buildItemsInputHero">Предметы (через запятую)</label>
                    <input type="text" id="buildItemsInputHero" placeholder="Например: Radiance, Manta Style, Skull Basher" required>
                </div>
                <div class="build-form-actions">
                    <button type="submit" class="btn-success">
                        <i class="fas fa-save"></i> Сохранить сборку
                    </button>
                    <button type="button" onclick="closeBuildModal()" class="btn-secondary">
                        Отмена
                    </button>
                </div>
            </form>
        </div>
    `;
    
    modal.style.display = 'block';
}

async function submitBuildFromHero(e, heroId) {
    e.preventDefault();
    
    const buildName = document.getElementById('buildNameInputHero').value.trim();
    const itemsInput = document.getElementById('buildItemsInputHero').value.trim();
    
    if (!buildName || !itemsInput) {
        alert('Пожалуйста, заполните все поля');
        return;
    }
    
    const items = itemsInput.split(',').map(item => item.trim()).filter(item => item);
    
    try {
        await createBuild(heroId, buildName, items);
        closeBuildModal();
        // Обновляем детали героя
        renderHeroDetails(heroId);
        alert('✅ Сборка успешно создана!');
    } catch (error) {
        alert('Ошибка создания сборки: ' + error.message);
    }
}

function selectHeroDirectly(heroId) {
    currentCategory = "all";
    searchQuery = "";
    
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(btn => btn.classList.remove('active'));
    const allTab = document.querySelector('.tab-btn[data-category="all"]');
    if (allTab) allTab.classList.add('active');

    const searchInput = document.getElementById('heroSearchInput');
    if (searchInput) searchInput.value = "";

    selectedHeroId = heroId;
    renderHeroList();
    renderHeroDetails(heroId);

    document.getElementById('detailsCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderTrends() {
    const trendsHeroes = ["lifestealer", "wk", "nightstalker"];
    const trendsContainer = document.getElementById('trendsHeroesContainer');
    if (trendsContainer) {
        trendsContainer.innerHTML = trendsHeroes.map(id => {
            const h = heroesDatabase.find(x => x.id === id);
            if (!h) return '';
            return `
                <span class="db-badge clickable synergy" onclick="selectHeroDirectly('${h.id}')" style="background: #1c242d; border: 1px solid #2d3b48;">
                    <img src="${getHeroImageUrl(h)}" alt="${h.name}">
                    <span style="color:#fff;">${h.name} (${h.winrate})</span>
                </span>
            `;
        }).join('');
    }

    const trendsItems = ["Falcon Blade", "Manta Style", "Radiance", "Blade Mail"];
    const itemsContainer = document.getElementById('trendsItemsContainer');
    if (itemsContainer) {
        itemsContainer.innerHTML = trendsItems.map(item => `
            <div class="db-item-card">
                <img class="item-icon" src="${getItemImageUrl(item)}" alt="${item}">
                <span>${item}</span>
            </div>
        `).join('');
    }
}

function initEvents() {
    const searchInput = document.getElementById('heroSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderHeroList();
        });
    }

    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            currentCategory = tab.getAttribute('data-category');
            tabs.forEach(btn => btn.classList.remove('active'));
            tab.classList.add('active');
            renderHeroList();
        });
    });
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    initEvents();
    renderHeroList();
    renderTrends();
});