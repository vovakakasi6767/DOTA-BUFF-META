// Проверка авторизации
function checkAuth() {
    const user = localStorage.getItem('dota_user');
    if (user) {
        try {
            const userData = JSON.parse(user);
            document.getElementById('userInfo').style.display = 'flex';
            document.getElementById('authButtons').style.display = 'none';
            document.getElementById('usernameDisplay').textContent = userData.username;
            document.getElementById('userBuildsBtn').style.display = 'block';
            return userData;
        } catch (e) {
            localStorage.removeItem('dota_user');
        }
    }
    return null;
}

// Выход
function logout() {
    localStorage.removeItem('dota_user');
    window.location.reload();
}

// Авторизация
async function login(username, password) {
    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('dota_user', JSON.stringify({ 
                username: data.user.username,
                builds: data.user.builds || []
            }));
            window.location.href = '../index.html';
        } else {
            throw new Error(data.message || 'Ошибка авторизации');
        }
    } catch (error) {
        throw new Error(error.message);
    }
}

// Регистрация
async function register(username, password, email) {
    try {
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('dota_user', JSON.stringify({ 
                username: data.user.username,
                builds: []
            }));
            window.location.href = '../index.html';
        } else {
            throw new Error(data.message || 'Ошибка регистрации');
        }
    } catch (error) {
        throw new Error(error.message);
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем авторизацию на главной странице
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        const user = checkAuth();
        if (user) {
            loadUserBuilds(user.username);
        }
    }
    
    // Обработчики для страниц авторизации
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            const errorEl = document.getElementById('authError');
            
            try {
                await login(username, password);
            } catch (error) {
                errorEl.textContent = error.message;
                errorEl.style.display = 'block';
            }
        });
    }
    
    if (document.getElementById('registerForm')) {
        document.getElementById('registerForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            const confirmPassword = document.getElementById('confirmPassword').value.trim();
            const errorEl = document.getElementById('authError');
            
            if (password !== confirmPassword) {
                errorEl.textContent = 'Пароли не совпадают';
                errorEl.style.display = 'block';
                return;
            }
            
            try {
                await register(username, password, email);
            } catch (error) {
                errorEl.textContent = error.message;
                errorEl.style.display = 'block';
            }
        });
    }
    
    // Кнопка выхода
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});