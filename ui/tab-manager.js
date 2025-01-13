// Tab Manager
class TabManager {
    constructor() {
        this.tabs = document.querySelectorAll('.tab-btn');
        this.slider = document.querySelector('.slider-bg');
        this.setupEventListeners();
        this.updateSlider(document.querySelector('.tab-btn.active'));
    }

    setupEventListeners() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab);
            });
        });

        // Update slider on window resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.updateSlider(document.querySelector('.tab-btn.active'));
            }, 100);
        });
    }

    switchTab(tab) {
        // Update active state
        this.tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Show corresponding content
        const targetId = tab.getAttribute('data-tab');
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = content.id === targetId ? 'block' : 'none';
        });

        // Update slider position
        this.updateSlider(tab);

        // Dispatch tab change event
        const event = new CustomEvent('tab-change', {
            detail: { tabId: targetId }
        });
        document.dispatchEvent(event);
    }

    updateSlider(activeTab) {
        if (!activeTab || !this.slider) return;
        
        const buttonRect = activeTab.getBoundingClientRect();
        const containerRect = activeTab.parentElement.getBoundingClientRect();
        
        this.slider.style.width = buttonRect.width + 'px';
        this.slider.style.transform = `translateX(${buttonRect.left - containerRect.left}px)`;
    }
}

export default TabManager;
