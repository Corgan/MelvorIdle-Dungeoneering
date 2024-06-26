const { loadModule } = mod.getContext(import.meta);

export class DungeoneeringCombatAreaMenuElement extends CombatAreaMenuElement {
    constructor() {
        super();
    }
    setArea(area) {
        super.setArea(area);
        if(this.attemptsContainer === undefined)
            this.attemptsContainer = createElement('div', {
                classList: ['font-size-2sm'],
                parent: this.unlockedContainer
            });
        this.updateAttemptsCount(area);
    }
    toggleOptions(area) {
        super.toggleOptions(area);
        this.updateAreaEffect(area);
    }
    setAreaEffect(area) {
        showElement(this.areaEffectContainer);
        this.areaEffectContainer.classList.replace('text-success', 'text-danger');
        this.updateAreaEffect(area);
    }
    updateAreaEffect(area) {
        if(this.isOpen) {
            this.effectDescription.innerHTML = `Click to hide modifiers ${area.areaEffectDescription}`;
        } else {
            this.effectDescription.innerHTML = 'Click to show modifiers';
        }
    }
    updateAttemptsCount(area) {
        this.attemptsContainer.innerHTML = `Attempts: <span class="${area.attempts >= area.maxAttempts ? 'text-danger' : ''}">${area.attempts} / ${area.maxAttempts}</span>`;
    }
}
window.customElements.define('dungeoneering-combat-area-menu', DungeoneeringCombatAreaMenuElement);