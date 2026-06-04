
import { renderElementList } from "./views/element-list.js";
import { state } from "./state.js";

export function bindElementFilterEvents(root) {
    if(!root) return;
    const difficultyContainer   = root.querySelector('#filterDifficulty');
    const groupContainer        = root.querySelector('#filterGroup');
    const learnedCheckbox       = root.querySelector('#filterLearnedElements');
    const orderSelect           = root.querySelector('#filter-order');
    const searchInput           = root.querySelector('#searchInput');

    difficultyContainer?.addEventListener('click', async (event) => {
        const button = event.target.closest('button');
        if(!button) return;
        state.elementList.filter.difficulty = button.dataset.value
            ? Number(button.dataset.value)
            : null;
        setActiveButton(difficultyContainer, button);
        renderElementList(root);
    });
    groupContainer?.addEventListener('click', async (event) => {
        const button = event.target.closest('button');
        if(!button) return;
        state.elementList.filter.group = button.dataset.value
            ? Number(button.dataset.value)
            : null;
        setActiveButton(groupContainer, button);
        renderElementList(root); 
    });
    learnedCheckbox?.addEventListener('change', async (event) => {
        state.elementList.filter.learned = event.target.checked;
        renderElementList(root);
    });
    orderSelect?.addEventListener('change', (event) => {
        state.elementList.filter.order = event.target.value;
        renderElementList(root);
    });
    searchInput?.addEventListener('input', debounce(async (event) => {
        state.elementList.filter.search = event.target.value;
        renderElementList(root);
    }, 300));
}


function setActiveButton(container, activeButton) {
    container.querySelectorAll('button').forEach(btn => {
        btn.classList.remove('active-filter');
    });
    activeButton.classList.add('active-filter');
}

function debounce(fn, delay = 300) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}
