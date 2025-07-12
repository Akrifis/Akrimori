// Инициализация табов
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const status = button.dataset.list;
            // Здесь будет загрузка данных для выбранного статуса
        });
    });
});

// Дополнительные функции сообщества
function loadCommunityPosts() {
    // Здесь можно реализовать загрузку обсуждений
}
