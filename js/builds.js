let currentUser = null;

// Загрузка сборок пользователя
async function loadUserBuilds(username) {
    try {
        const response = await fetch(`http://localhost:3000/api/builds/${username}`);
        const data = await response.json();
        
        if (response.ok) {
            currentUser = username;
            // Обновляем локальное хранилище
            const userData = JSON.parse(localStorage.getItem('dota_user'));
            userData.builds = data.builds;
            localStorage.setItem('dota_user', JSON.stringify(userData));
            return data.builds;
        }
        return [];
    } catch (error) {
        console.error('Ошибка загрузки сборок:', error);
        return [];
    }
}

// Создание новой сборки
async function createBuild(heroId, buildName, items) {
    const user = JSON.parse(localStorage.getItem('dota_user'));
    if (!user) {
        alert('Пожалуйста, авторизуйтесь');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3000/api/builds', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: user.username,
                heroId: heroId,
                buildName: buildName,
                items: items
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Обновляем локальные данные
            user.builds = data.builds;
            localStorage.setItem('dota_user', JSON.stringify(user));
            return data.builds;
        } else {
            throw new Error(data.message || 'Ошибка создания сборки');
        }
    } catch (error) {
        throw new Error(error.message);
    }
}

// Удаление сборки
async function deleteBuild(buildId) {
    const user = JSON.parse(localStorage.getItem('dota_user'));
    if (!user) {
        alert('Пожалуйста, авторизуйтесь');
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:3000/api/builds/${buildId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: user.username
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            user.builds = data.builds;
            localStorage.setItem('dota_user', JSON.stringify(user));
            return data.builds;
        } else {
            throw new Error(data.message || 'Ошибка удаления сборки');
        }
    } catch (error) {
        throw new Error(error.message);
    }
}

// Показать сборки пользователя в модалке
async function showUserBuilds() {
    const user = JSON.parse(localStorage.getItem('dota_user'));
    if (!user) {
        alert('Пожалуйста, авторизуйтесь');
        return;
    }
    
    const modal = document.getElementById('buildModal');
    const body = document.getElementById('buildModalBody');
    const title = document.getElementById('buildModalTitle');
    
    title.innerHTML = `<i class="fas fa-folder-open"></i> Мои сборки (${user.username})`;
    modal.style.display = 'block';
    
    // Загружаем свежие данные
    const builds = await loadUserBuilds(user.username);
    
    if (!builds || builds.length === 0) {
        body.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #8091a5;">
                <i class="fas fa-box-open" style="font-size: 3rem; display: block; margin-bottom: 15px;"></i>
                <p style="font-size: 1.1rem;">У вас пока нет созданных сборок</p>
                <p style="font-size: 0.9rem; margin-top: 10px;">Создайте свою первую сборку для любимого героя!</p>
            </div>
            ${createBuildForm()}
        `;
    } else {
        let html = `
            <div style="margin-bottom: 20px;">
                ${createBuildForm()}
            </div>
            <div style="display: flex; flex-direction: column; gap: 15px;">
        `;
        
        builds.forEach((build, index) => {
            const hero = heroesDatabase.find(h => h.id === build.heroId);
            html += `
                <div class="build-item">
                    <div class="build-item-header">
                        <h3>
                            ${hero ? `<img src="${getHeroImageUrl(hero)}" style="width: 30px; height: 17px; object-fit: cover; border-radius: 3px; vertical-align: middle; margin-right: 8px;">` : ''}
                            ${build.buildName}
                            ${hero ? `<span style="color: #8091a5; font-size: 0.8rem; font-weight: normal;">(${hero.name})</span>` : ''}
                        </h3>
                        <div class="build-actions">
                            <button onclick="deleteBuildById('${build.id}')" class="btn-danger">
                                <i class="fas fa-trash"></i> Удалить
                            </button>
                        </div>
                    </div>
                    <div class="build-items-grid">
                        ${build.items.map(item => `
                            <div class="db-item-card">
                                <img class="item-icon" src="${getItemImageUrl(item)}" alt="${item}" onerror="this.src='https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/default.png'">
                                <span>${item}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        body.innerHTML = html;
    }
}

// Создание формы для новой сборки
function createBuildForm() {
    return `
        <div class="build-form">
            <h3><i class="fas fa-plus-circle" style="color: #a9cf46;"></i> Создать новую сборку</h3>
            <form id="buildForm" onsubmit="submitBuild(event)">
                <div class="build-form-group">
                    <label for="buildHeroSelect">Выберите героя</label>
                    <select id="buildHeroSelect" required>
                        <option value="">Выберите героя...</option>
                        ${heroesDatabase.map(hero => `
                            <option value="${hero.id}">${hero.name}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="build-form-group">
                    <label for="buildNameInput">Название сборки</label>
                    <input type="text" id="buildNameInput" placeholder="Например: Моя ультимативная сборка" required>
                </div>
                <div class="build-form-group">
                    <label for="buildItemsInput">Предметы (через запятую)</label>
                    <input type="text" id="buildItemsInput" placeholder="Например: Radiance, Manta Style, Skull Basher" required>
                </div>
                <div class="build-form-actions">
                    <button type="submit" class="btn-success">
                        <i class="fas fa-save"></i> Сохранить сборку
                    </button>
                </div>
            </form>
        </div>
    `;
}

// Отправка новой сборки
async function submitBuild(e) {
    e.preventDefault();
    
    const heroId = document.getElementById('buildHeroSelect').value;
    const buildName = document.getElementById('buildNameInput').value.trim();
    const itemsInput = document.getElementById('buildItemsInput').value.trim();
    
    if (!heroId || !buildName || !itemsInput) {
        alert('Пожалуйста, заполните все поля');
        return;
    }
    
    const items = itemsInput.split(',').map(item => item.trim()).filter(item => item);
    
    try {
        await createBuild(heroId, buildName, items);
        // Перезагружаем список сборок
        await showUserBuilds();
        // Показываем сообщение об успехе
        const form = document.getElementById('buildForm');
        const successMsg = document.createElement('div');
        successMsg.style.cssText = 'background: rgba(169, 207, 70, 0.15); border: 1px solid rgba(169, 207, 70, 0.3); color: #a9cf46; padding: 12px; border-radius: 8px; margin-top: 10px;';
        successMsg.textContent = '✅ Сборка успешно создана!';
        form.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
    } catch (error) {
        alert('Ошибка создания сборки: ' + error.message);
    }
}

// Удаление сборки по ID
async function deleteBuildById(buildId) {
    if (!confirm('Вы уверены, что хотите удалить эту сборку?')) {
        return;
    }
    
    try {
        await deleteBuild(buildId);
        await showUserBuilds();
    } catch (error) {
        alert('Ошибка удаления сборки: ' + error.message);
    }
}

// Закрыть модальное окно
function closeBuildModal() {
    document.getElementById('buildModal').style.display = 'none';
}

// Закрыть при клике вне модалки
window.onclick = function(event) {
    const modal = document.getElementById('buildModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}