console.log('🚀 Evraz Dashboard загружен!');

// Добавляем анимацию при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Анимация карточек
    document.querySelectorAll('.card').forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
});

// Функция для обновления данных (можно вызвать из консоли)
function refreshDashboard() {
    location.reload();
}