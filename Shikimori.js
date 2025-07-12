class ShikimoriAuth {
    constructor() {
        this.clientId = 'ваш_client_id'; // Зарегистрируйте приложение на shikimori.one/oauth
        this.redirectUri = encodeURIComponent(window.location.origin);
        this.token = localStorage.getItem('shiki_token');
        this.userData = JSON.parse(localStorage.getItem('shiki_user') || null;
        
        this.init();
    }
    
    init() {
        if (window.location.search.includes('code=')) {
            this.handleRedirect();
        }
        
        if (this.token) {
            this.showProfile();
        }
        
        document.getElementById('shiki-connect').addEventListener('click', this.authorize.bind(this));
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
            this.loadAnimeData();
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
                client_secret: 'ваш_client_secret',
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
        document.getElementById('shiki-connect').style.display = 'none';
        const profile = document.getElementById('shiki-profile');
        profile.style.display = 'flex';
        
        document.getElementById('shiki-avatar').src = `https://shikimori.one${this.userData.avatar}`;
        document.getElementById('shiki-username').textContent = this.userData.nickname;
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
        listElement.innerHTML = '';
        
        animeList.forEach(anime => {
            const animeCard = document.createElement('div');
            animeCard.className = 'anime-card';
            animeCard.innerHTML = `
                <img class="anime-poster" src="https://shikimori.one${anime.anime.image.preview}" alt="${anime.anime.russian || anime.anime.name}">
                <div class="anime-info">
                    <h3 class="anime-title">${anime.anime.russian || anime.anime.name}</h3>
                    <div class="anime-meta">
                        <span>${anime.episodes}/${anime.anime.episodes || '?'} эп.</span>
                        <span>${anime.score ? '★'.repeat(anime.score) : '—'}</span>
                    </div>
                </div>
            `;
            listElement.appendChild(animeCard);
        });
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new ShikimoriAuth();
});
