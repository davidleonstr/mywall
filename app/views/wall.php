<div id="board">
	<div id="world"></div>
</div>

<div id="toolbar">
	<div class="toolbar-row">
		<button class="btn" id="addCardBtn">+ Card</button>
		<a href="/" id="link-to-login" class="hidden home-link btn">+ Card</a>
		<button class="btn icon" id="zoomOutBtn" aria-label="Minus zoom">-</button>
		<span class="zoom-level" id="zoomLevel">100%</span>
    	<button class="btn icon" id="zoomInBtn" aria-label="Plus zoom">+</button>
    	<button class="btn" id="resetBtn">Center</button>
	</div>
	<p class="hint">Drag the board to move · Double-click to add a tile · Tap the floppy disk to save changes to a tile</p>
</div>

<div id="stamp">X <span id="coordX">000</span> · Y <span id="coordY">000</span></div>

<script type="module" src="/src/js/wall.js"></script>

<script type="module" defer>
    import { renderSeedCards, sendCardsRequest } from "/src/js/wall.js";
    import { getUserId, getUserRootAccess } from "/src/js/user.js";

    (async () => {
        try {
            const cardRecords = await sendCardsRequest();
            const yourId = getUserId();
            const yourRoot = getUserRootAccess();
            let seedCards = [];

            if (cardRecords.success) {
                seedCards = cardRecords.data.cards.map(card => {
                    let yourCard = false;

                    if (yourId) {
                        yourCard = card.account_id == yourId;
                    }

                    if (Number(yourRoot)) {
                        yourCard = true;
                    }
                    
                    return {
                        ...card,
						body: card.content,
                        yours: yourCard
                    };
                });
            }
            renderSeedCards(seedCards);
        } catch (error) {
            console.error('Error loading cards:', error);
			window.location.href = '/';
        }
    })();
</script>

<script type="module" defer>
    import { getUserId } from "/src/js/user.js";

    function transformWallNav() {
        if (getUserId() == undefined) {
            document.getElementById('addCardBtn').style.display = 'none';
            document.getElementById('link-to-login').style.display = 'block';
        }
    }

    transformWallNav();
</script>