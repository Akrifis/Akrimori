class ShikimoriAuth {
    constructor() {
        this.clientId = '3VfZbO9bAafSn-V6DD28neLh8GQlnL7pbx8qcYyTQqY'; // Замените на реальный
        this.redirectUri = encodeURIComponent(window.location.origin);
        this.token = localStorage.getItem('shiki_token');
        this.userData = JSON.parse(localStorage.getItem('shiki_user')) || null;
        
        this.init();
    }
    
    init() {
        // Обработка OAuth редиректа
        if (window.location.search.includes('code=')) {
            this.handleRedirect();
        }
        
        // Показать профиль если авторизованы
        if (this.token && this.userData) {
            this.showProfile();
        }
        
        // Кнопка авторизации
        document.getElementById('shiki-connect')?.addEventListener('click', () => this.authorize());
    }
    
    authorize() {
        if (this.token) {
            this.logout();
            return;
        }
        
        const authUrl = `https://shikimori.one/oauth/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&response_type=code&scope=user_rates`;
        window.location.href = authUrl;
    }
    
    async handleRedirect() {
        const code = new URLSearchParams(window.location.search).get('code');
        
        try {
            const token = await this.getToken(code);
            this.token = token;
            localStorage.setItem('shiki_token', token);
            
            const user = await this.getUserData();
            this.userData = user;
            localStorage.setItem('shiki_user', JSON.stringify(user));
            
            window.history.replaceState({}, document.title, window.location.pathname);
            this.showProfile();
            
            // Если на странице аниме - загружаем данные
            if (document.getElementById('anime-page').classList.contains('active-page')) {
                this.loadAnimeData('watching');
            }
        } catch (error) {
            console.error('Auth error:', error);
        }
    }
    
    async getToken(code) {
        const response = await fetch('https://shikimori.one/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                client_id: this.clientId,
                client_secret: 'cZDMvRC1pNtlNAlVyIfZjFl4PWcoxbvBePmMmQW86wQ', // Замените на реальный
                code: code,
                redirect_uri: decodeURIComponent(this.redirectUri)
            })
        });
        
        const data = await response.json();
        return data.access_token;
    }
    
    async getUserData() {
        const response = await fetch('https://shikimori.one/api/users/whoami', {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });
        return await response.json();
    }
    
    showProfile() {
        const connectBtn = document.getElementById('shiki-connect');
        const mobileBtn = document.getElementById('mobile-shiki-btn');
        const profile = document.getElementById('shiki-profile');
        
        if (connectBtn) connectBtn.style.display = 'none';
        if (mobileBtn) mobileBtn.style.display = 'none';
        if (profile) {
            profile.style.display = 'flex';
            document.getElementById('shiki-avatar').src = `https://shikimori.one${this.userData.avatar}`;
            document.getElementById('shiki-username').textContent = this.userData.nickname;
        }
    }
    
    logout() {
        localStorage.removeItem('shiki_token');
        localStorage.removeItem('shiki_user');
        window.location.reload();
    }
    
    async loadAnimeData(status = 'watching') {
        try {
            const response = await fetch(`https://shikimori.one/api/users/${this.userData.id}/anime_rates?status=${status}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const animeList = await response.json();
            this.displayAnimeList(animeList);
        } catch (error) {
            console.error('Error loading anime:', error);
        }
    }
    
    displayAnimeList(animeList) {
        const listElement = document.getElementById('anime-list');
        if (!listElement) return;
        
        listElement.innerHTML = animeList.map(anime => `
            <div class="anime-card" onclick="showAnimeDetails(${anime.anime.id})">
                <img class="anime-poster" src="https://shikimori.one${anime.anime.image.preview}" alt="${anime.anime.russian || anime.anime.name}">
                <div class="anime-info">
                    <h3>${anime.anime.russian || anime.anime.name}</h3>
                    <p>${anime.episodes}/${anime.anime.episodes || '?'} эп.</p>
                    <div class="rating">${anime.score ? '★'.repeat(anime.score) : 'Без оценки'}</div>
                </div>
            </div>
        `).join('');
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    window.shikimoriAuth = new ShikimoriAuth();
});

// Глобальная функция для показа деталей аниме
window.showAnimeDetails = function(id) {
    alert(`Открываем страницу аниме с ID: ${id}\nВ реальном приложении будет переход на детальную страницу`);
};
