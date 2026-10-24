import { POSTCARDPOINT, GETCARDPOINT } from './endpoints.js';
import { SAVEICON, DELETEICON } from './icons.js';
import { getUserId, getUserAuthKey } from './user.js';

const route = window.location.pathname; 
const wallName = route.split('/').filter(Boolean)[0];

const board = document.getElementById('board');
const world = document.getElementById('world');
const zoomLevelEl = document.getElementById('zoomLevel');
const coordX = document.getElementById('coordX');
const coordY = document.getElementById('coordY');

const COLORS = ['rust', 'teal', 'ochre', 'indigo'];
const COLORVALUES = {
    rust: getCss('--rust'), teal: getCss('--teal'),
    ochre: getCss('--ochre'), indigo: getCss('--indigo')
};

let scale = 1, tx = 0, ty = 0;
const MINSCALE = 0.3, MAXSCALE = 2.5;
const isSmallScreen = window.innerWidth < 560;
let accessionCounter = 0;

function makeId() {
    return 'new-card';
}

function getCss(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function applyTransform() {
    world.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomLevelEl.textContent = Math.round(scale * 100) + '%';
    updateBoardTexture();
}

function updateBoardTexture() {
    const size = 28 * scale;
    board.style.backgroundSize = size + 'px ' + size + 'px';
    board.style.backgroundPosition = tx + 'px ' + ty + 'px';
}

function centerView() {
    const rect = board.getBoundingClientRect();
    scale = isSmallScreen ? 0.7 : 1;
    tx = rect.width / 2 - 400 * scale;
    ty = rect.height / 2 - 280 * scale;
    applyTransform();
}

function screenToWorld(clientX, clientY) {
    const rect = board.getBoundingClientRect();
    return {
        x: (clientX - rect.left - tx) / scale,
        y: (clientY - rect.top - ty) / scale
    };
}

function autosizeField(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

function autosizeCard(card) {
    autosizeField(card.querySelector('.card-title'));
    autosizeField(card.querySelector('.card-body'));
}

function createCardElement(data) {
    const rotation = data.rot !== undefined ? data.rot : (Math.random() * 6 - 3);
    accessionCounter = Math.max(accessionCounter, data.accession || 0);
    const yours = data.yours;

    const card = document.createElement('form');
    card.className = 'card';
    card.dataset.id = data.id;
    card.dataset.color = data.color || 'rust';
    card.dataset.yours = yours ? '1' : '0';
    card.setAttribute('autocomplete', 'off');
    card.style.left = data.x + 'px';
    card.style.top = data.y + 'px';
    card.style.setProperty('--rot', rotation.toFixed(2) + 'deg');
    card.style.setProperty('--pin-color', COLORVALUES[data.color] || COLORVALUES.rust);
    card.style.setProperty('--delay', (Math.random() * 0.15) + 's');

    card.innerHTML = `
        <div class="pin"></div>
        <div class="card-actions">
            <button type="submit" class="icon-btn save-btn" aria-label="Guardar cambios">${SAVEICON}</button>
            <button type="button" class="icon-btn delete-btn" aria-label="Eliminar ficha">${DELETEICON}</button>
        </div>
        <div class="card-top">
            <span class="dot"></span>
            <textarea class="card-title" name="title" rows="1" spellcheck="false" placeholder="Untitled" autocomplete="off"></textarea>
        </div>
        <textarea class="card-body" name="body" rows="1" spellcheck="false" placeholder="Field notes…" autocomplete="off"></textarea>
        <input type="hidden" name="id" value="${data?.id}">
        <input type="hidden" class="card-x" name="x" value="${data.x}">
        <input type="hidden" class="card-y" name="y" value="${data.y}">
        <div class="accession" data-num="${data.accession || 0}">No. ${String(data.accession || 0).padStart(3, '0')}</div>
    `;
    card.querySelector('.card-title').value = data.title || '';
    card.querySelector('.card-body').value = data.body || '';

    applyOwnershipUI(card, yours);

    world.appendChild(card);
    attachCardBehavior(card);
    autosizeCard(card);
    return card;
}

function applyOwnershipUI(card, yours) {
    const titleInput = card.querySelector('.card-title');
    const bodyInput = card.querySelector('.card-body');
    const saveBtn = card.querySelector('.save-btn');
    const deleteBtn = card.querySelector('.delete-btn');
    titleInput.readOnly = !yours;
    bodyInput.readOnly = !yours;
    saveBtn.disabled = !yours;
    deleteBtn.disabled = !yours;
    saveBtn.style.display = yours ? 'flex' : 'none';
    deleteBtn.style.display = yours ? 'flex' : 'none';
}

function syncHiddenPosition(card, x, y) {
    card.querySelector('.card-x').value = x;
    card.querySelector('.card-y').value = y;
}

export function updateCardElement(card, data) {
    card.dataset.color = data.color || card.dataset.color;
    if (data.yours !== undefined) {
        card.dataset.yours = data.yours ? '1' : '0';
        applyOwnershipUI(card, !!data.yours);
    }
    card.style.left = data.x + 'px';
    card.style.top = data.y + 'px';
    syncHiddenPosition(card, data.x, data.y);
    if (data.rot !== undefined) card.style.setProperty('--rot', data.rot.toFixed(2) + 'deg');
    card.style.setProperty('--pin-color', COLORVALUES[data.color] || COLORVALUES.rust);
    card.querySelector('.card-title').value = data.title || '';
    card.querySelector('.card-body').value = data.body || '';
    const acc = card.querySelector('.accession');
    acc.dataset.num = data.accession || acc.dataset.num;
    acc.textContent = 'No. ' + String(data.accession || acc.dataset.num).padStart(3, '0');
    accessionCounter = Math.max(accessionCounter, data.accession || 0);
}

function markDirty(card) {
    const btn = card.querySelector('.save-btn');
    btn.classList.remove('is-saved', 'is-error');
}

function markSaved(card, success, animate) {
    const btn = card.querySelector('.save-btn');
    if (success) {
        btn.classList.add('is-saved');
        btn.classList.remove('is-error');
    } else {
        btn.classList.add('is-error');
        btn.classList.remove('is-saved');
    }
    if (animate) {
        btn.classList.remove('pulse');
        void btn.offsetWidth;
        btn.classList.add('pulse');
    }
}

async function sendCardWriteRequest(method, payload) {
	const response = await fetch(POSTCARDPOINT, {
		method,
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});

	if (!response.ok) {
		throw new Error('Request failed with status ' + response.status);
	}

	return response.json();
}

function collectCardData(card) {
    const fd = new FormData(card);
    const rotStr = card.style.getPropertyValue('--rot');
    return {
        id: card.dataset.id,
        x: parseFloat(fd.get('x')) || 0,
        y: parseFloat(fd.get('y')) || 0,
        rot: parseFloat(rotStr) || 0,
        color: card.dataset.color,
        title: fd.get('title') || '',
        body: fd.get('body') || '',
        accession: parseInt(card.querySelector('.accession').dataset.num, 10) || 0
    };
}

async function saveCard(card) {
	if (card.dataset.yours !== '1') return;
	const btn = card.querySelector('.save-btn');
	btn.classList.add('saving');
	try {
		const data = collectCardData(card);
		const accountId = getUserId();
        const authKey = getUserAuthKey();

		const result = await sendCardWriteRequest('POST', {
			...data,
            wall_name: wallName,
			account_id: accountId,
            auth_key: authKey
		});

		if (result.success) {
			markSaved(card, true, true);
            const newId = result.data.id;
			card.dataset.id = newId;
			card.querySelector('input[name="id"]').value = newId;
		} else {
			console.error('The server rejected the save:', result.message);
			markSaved(card, false, true);
		}
	} catch (err) {
		console.error('The record could not be saved:', err);
		markSaved(card, false, true);
	} finally {
		btn.classList.remove('saving');
	}
}

async function deleteCard(card) {
	if (card.dataset.yours !== '1') return;
	const id = card.dataset.id;
	const accountId = getUserId();
    const authKey = getUserAuthKey();

    if (id === makeId()) {
        card.remove();
        return;
    }

	try {
		const result = await sendCardWriteRequest('POST', {
			id,
			account_id: accountId,
            auth_key: authKey,
            delete: true
		});

		if (result.success) {
			card.remove();
		} else {
			console.error('The server rejected the delete:', result.message);
			markSaved(card, false, true);
		}
	} catch (err) {
		console.error('The record could not be deleted:', err);
		markSaved(card, false, true);
	}
}

function attachCardBehavior(card) {
    let pointerDown = false;
    let dragging = false;
    let startX, startY, origLeft, origTop;
    const THRESHOLD = 5;

    card.addEventListener('submit', (e) => {
        e.preventDefault();
        saveCard(card);
    });

    card.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.icon-btn')) return;
        if (e.target.matches('input, textarea')) return;
        pointerDown = true;
        dragging = false;
        startX = e.clientX;
        startY = e.clientY;
        origLeft = parseFloat(card.style.left);
        origTop = parseFloat(card.style.top);
        card.setPointerCapture(e.pointerId);
    });

    card.addEventListener('pointermove', (e) => {
        if (!pointerDown) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (!dragging && Math.hypot(dx, dy) > THRESHOLD) {
            dragging = true;
            card.classList.add('dragging');
            world.appendChild(card);
        }
        if (dragging) {
            const newLeft = origLeft + dx / scale;
            const newTop = origTop + dy / scale;
            card.style.left = newLeft + 'px';
            card.style.top = newTop + 'px';
            syncHiddenPosition(card, newLeft, newTop);
            e.stopPropagation();
        }
    });

    function endPointer(e) {
        if (!pointerDown) return;
        pointerDown = false;
        if (dragging) {
            dragging = false;
            card.classList.remove('dragging');
        }
        try { card.releasePointerCapture(e.pointerId); } catch (err) { }
    }
    card.addEventListener('pointerup', endPointer);
    card.addEventListener('pointercancel', endPointer);

    card.querySelector('.card-title').addEventListener('input', () => markDirty(card));
    card.querySelector('.card-body').addEventListener('input', () => markDirty(card));
    card.querySelector('.card-title').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') e.preventDefault();
    });
    card.querySelector('.save-btn').addEventListener('click', (e) => {
        e.stopPropagation();
    });
    card.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteCard(card);
    });
}

export function renderSeedCards(seedCards) {
    seedCards.forEach((s) => {
        accessionCounter++;
        createCardElement({
            id: s.id, yours: s.yours, x: s.x, y: s.y, color: s.color,
            title: s.title, body: s.body, accession: accessionCounter
        });
    });
}

export async function sendCardsRequest() {
    const response = await fetch(`${GETCARDPOINT}?wall_name=${encodeURIComponent(wallName)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
        throw new Error('Request failed with status ' + response.status);
    }

    return response.json();
}

let panning = false;
let panStartX, panStartY, panOrigTx, panOrigTy;

board.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.card')) return;
    if (activePointers.size >= 2) return;
    panning = true;
    board.classList.add('panning');
    board.setPointerCapture(e.pointerId);
    panStartX = e.clientX;
    panStartY = e.clientY;
    panOrigTx = tx;
    panOrigTy = ty;
});

board.addEventListener('pointermove', (e) => {
    const wp = screenToWorld(e.clientX, e.clientY);
    coordX.textContent = String(Math.round(wp.x)).padStart(3, '0');
    coordY.textContent = String(Math.round(wp.y)).padStart(3, '0');

    if (!panning || activePointers.size >= 2) return;
    tx = panOrigTx + (e.clientX - panStartX);
    ty = panOrigTy + (e.clientY - panStartY);
    applyTransform();
});

function endPan(e) {
    if (!panning) return;
    panning = false;
    board.classList.remove('panning');
    try { board.releasePointerCapture(e.pointerId); } catch (err) { }
}
board.addEventListener('pointerup', endPan);
board.addEventListener('pointercancel', endPan);

board.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = board.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const worldX = (mx - tx) / scale;
    const worldY = (my - ty) / scale;
    const delta = -e.deltaY * 0.0015;
    let newScale = Math.min(MAXSCALE, Math.max(MINSCALE, scale * (1 + delta)));
    tx = mx - worldX * newScale;
    ty = my - worldY * newScale;
    scale = newScale;
    applyTransform();
}, { passive: false });

function zoomStep(factor) {
    const rect = board.getBoundingClientRect();
    const mx = rect.width / 2;
    const my = rect.height / 2;
    const worldX = (mx - tx) / scale;
    const worldY = (my - ty) / scale;
    let newScale = Math.min(MAXSCALE, Math.max(MINSCALE, scale * factor));
    tx = mx - worldX * newScale;
    ty = my - worldY * newScale;
    scale = newScale;
    applyTransform();
}

document.getElementById('zoomInBtn').addEventListener('click', () => zoomStep(1.2));
document.getElementById('zoomOutBtn').addEventListener('click', () => zoomStep(1 / 1.2));
document.getElementById('resetBtn').addEventListener('click', centerView);

function spawnCardAtCenter(cx, cy) {
    accessionCounter++;
    const color = COLORS[accessionCounter % COLORS.length];
    const card = createCardElement({ id: makeId(), yours: true, x: cx - 110, y: cy - 75, color, accession: accessionCounter });
    setTimeout(() => card.querySelector('.card-title').focus(), 60);
}

document.getElementById('addCardBtn').addEventListener('click', () => {
    const rect = board.getBoundingClientRect();
    const pos = screenToWorld(rect.left + rect.width / 2 + (Math.random() * 80 - 40), rect.top + rect.height / 2 + (Math.random() * 80 - 40));
    spawnCardAtCenter(pos.x, pos.y);
});

board.addEventListener('dblclick', (e) => {
    if (e.target.closest('.card')) return;
    const pos = screenToWorld(e.clientX, e.clientY);
    spawnCardAtCenter(pos.x, pos.y);
});

const activePointers = new Map();
let isPinching = false;
let pinchStartDist = 0, pinchStartScale = 1, pinchStartMid = { x: 0, y: 0 }, pinchStartTx = 0, pinchStartTy = 0;

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function mid(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }

board.addEventListener('pointerdown', (e) => {
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.size === 2) {
        isPinching = true;
        panning = false;
        board.classList.remove('panning');
        document.querySelectorAll('.card.dragging').forEach(c => c.classList.remove('dragging'));
        const pts = [...activePointers.values()];
        pinchStartDist = dist(pts[0], pts[1]) || 1;
        pinchStartMid = mid(pts[0], pts[1]);
        pinchStartScale = scale;
        pinchStartTx = tx;
        pinchStartTy = ty;
    }
}, true);

board.addEventListener('pointermove', (e) => {
    if (!activePointers.has(e.pointerId)) return;

    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (isPinching && activePointers.size === 2) {
        const pts = [...activePointers.values()];
        const newDist = dist(pts[0], pts[1]);
        const newMid = mid(pts[0], pts[1]);
        const ratio = newDist / pinchStartDist;
        const newScale = Math.min(MAXSCALE, Math.max(MINSCALE, pinchStartScale * ratio));
        const rect = board.getBoundingClientRect();
        const worldX = (pinchStartMid.x - rect.left - pinchStartTx) / pinchStartScale;
        const worldY = (pinchStartMid.y - rect.top - pinchStartTy) / pinchStartScale;
        tx = (newMid.x - rect.left) - worldX * newScale;
        ty = (newMid.y - rect.top) - worldY * newScale;
        scale = newScale;
        applyTransform();
    }
}, true);

function releasePointer(e) {
    activePointers.delete(e.pointerId);
    if (activePointers.size < 2) isPinching = false;
}
board.addEventListener('pointerup', releasePointer, true);
board.addEventListener('pointercancel', releasePointer, true);

window.addEventListener('resize', updateBoardTexture);

centerView();