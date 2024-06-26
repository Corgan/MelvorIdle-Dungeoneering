const { loadModule } = mod.getContext(import.meta);

const { DungeoneeringPortalRerollRadioElement } = await loadModule('src/components/dungeoneering-portal-reroll-radio.mjs');

export class DungeoneeringPortalRerollBoxElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('dungeoneering-portal-reroll-box-template'));
        this.playerHeader = getElementFromFragment(this._content, 'player-header', 'h5');
        this.enemyHeader = getElementFromFragment(this._content, 'enemy-header', 'h5');
        this.radioContainer = getElementFromFragment(this._content, 'radio-container', 'div');
        
        this.resetDefault = true;
        this.rerollRadioGroup = [];
    }
    connectedCallback() {
        this.appendChild(this._content);
    }

    setPortal(portal) {
        this.portal = portal;
        this.resetDefault = true;
        this.updateModifiers()
    }

    updateModifiers() {
        let modifiers = [];
        let radioIdx = 0;
        if(this.portal !== undefined) {
            this.radioContainer.append(this.playerHeader);
            this.portal.modifiers.forEach((modifier, i) => {
                let radio = this.updateModifier(radioIdx++, modifier, 'player', i);
                this.radioContainer.append(radio);
                radio.setTooltip(`<div class="font-size-2sm font-w600 text-center text-muted"><span class="text-combat-smoke">player - ${i}</span></div>`);        
            });

            this.radioContainer.append(this.enemyHeader);
            this.portal.enemyModifiers.forEach((modifier, i) => {
                let radio = this.updateModifier(radioIdx++, modifier, 'enemy', i);
                this.radioContainer.append(radio);

                radio.setTooltip(`<div class="font-size-2sm font-w600 text-center text-muted"><span class="text-combat-smoke">enemy - ${i}</span></div>`);        
            });
        }
        for(; radioIdx < this.rerollRadioGroup.length; radioIdx++) {
            this.rerollRadioGroup[radioIdx].remove();
        };

        if(this.resetDefault === true) {
            this.rerollRadioGroup[0].setChecked(true);
            this.resetDefault = false;
        }
    }

    updateModifier(radioIdx, modifier, type, modIdx) {
        let [description, textClass] = modifier.print();
        let modifierSpan = `<small><span class="${textClass}">${description}</span></small>`;


        if(this.rerollRadioGroup[radioIdx] === undefined) {
            let rerollRadio = new DungeoneeringPortalRerollRadioElement();
            rerollRadio.classList.add('col-12', 'text-left');
            rerollRadio.initialize({
                currentValue: false,
                name: "reroll",
                label: modifierSpan,
                value: modifier.id
            },
            () => {
                rerollRadio.setChecked(true);
                rerollRadio.input.blur();
            });
            this.radioContainer.append(rerollRadio);
            this.rerollRadioGroup[radioIdx] = rerollRadio;
        } else {
            this.radioContainer.append(this.rerollRadioGroup[radioIdx]);
            this.rerollRadioGroup[radioIdx].setLabel(modifierSpan);
            this.rerollRadioGroup[radioIdx].setValue(modifier.id);
        }
        return this.rerollRadioGroup[radioIdx];
    }

    getSelectedMod() {
        let selectedRadio = this.rerollRadioGroup.filter(i => i.input.checked)[0];
        if(selectedRadio !== undefined) {
            let mod = this.enchanting.mods.getObjectByID(selectedRadio.input.value);
            if(mod !== undefined)
                return mod;
        }
    }
}

window.customElements.define('dungeoneering-portal-reroll-box', DungeoneeringPortalRerollBoxElement);