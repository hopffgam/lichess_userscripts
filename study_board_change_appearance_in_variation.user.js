// ==UserScript==
// @name         Lichess Study Board Change Appearance in Variation
// @namespace    https://lichess.org/
// @version      1.0
// @description  Changes the board appearance in lichess studies when board shows a move that is in a variation instead of the main line
// @match        https://lichess.org/study/*
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const page = unsafeWindow;

    // ============================================================
    // SETTINGS
    // ============================================================

    const STORAGE_KEY =
        'lichess-show-variation-text';

    const TEXT_BOARD_WIDTH =
        2 / 3;

    const TEXT_COLOR =
        'rgba(120, 120, 120, 0.22)';

    // Read saved preference.
    let showVariationText =
        localStorage.getItem(STORAGE_KEY) !== 'false';


    // ============================================================
    // CREATE VARIATION TEXT
    // ============================================================

    const overlay =
        document.createElement('div');

    overlay.textContent =
        'VARIATION';

    overlay.style.position =
        'fixed';

    overlay.style.zIndex =
        '10';

    overlay.style.pointerEvents =
        'none';

    overlay.style.fontFamily =
        'sans-serif';

    overlay.style.fontSize =
        '100px';

    overlay.style.fontWeight =
        'bold';

    overlay.style.letterSpacing =
        '0.08em';

    overlay.style.color =
        TEXT_COLOR;

    overlay.style.whiteSpace =
        'nowrap';

    overlay.style.display =
        'none';

    overlay.style.visibility =
        'hidden';

    overlay.style.transform =
        'translate(-50%, -50%)';

    document.body.appendChild(overlay);


    // ============================================================
    // POSITION AND SIZE TEXT
    // ============================================================

    function positionOverlay(board) {

        const rect =
            board.getBoundingClientRect();

        if (rect.width <= 0 || rect.height <= 0) {
            return false;
        }

        /*
         * Keep the overlay rendered but invisible while measuring.
         * This prevents the large-text flash while still allowing
         * getBoundingClientRect() to measure the text.
         */
        overlay.style.display =
            'block';

        overlay.style.visibility =
            'hidden';

        // Measure at a known font size.
        overlay.style.fontSize =
            '100px';

        const textWidth =
            overlay.getBoundingClientRect().width;

        if (textWidth <= 0) {
            return false;
        }

        // Calculate the required font size.
        const targetWidth =
            rect.width * TEXT_BOARD_WIDTH;

        const fontSize =
            100 * targetWidth / textWidth;

        // Set final font size before making the text visible.
        overlay.style.fontSize =
            fontSize + 'px';

        // Centre the text on the board.
        overlay.style.left =
            (rect.left + rect.width / 2) + 'px';

        overlay.style.top =
            (rect.top + rect.height / 2) + 'px';

        return true;
    }


    // ============================================================
    // UPDATE
    // ============================================================

    function update() {

        const board =
            document.querySelector('cg-board');

        const ctrl =
            page.lichess?.analysis?.navigate?.ctrl;

        if (!board || !ctrl) {
            return false;
        }

        const variation =
            ctrl.onMainline === false;


        if (variation) {

            // Give variation boards a sepia appearance.
            board.style.filter =
                'sepia(1) saturate(0.7)';

            if (showVariationText) {

                /*
                 * Calculate size and position while invisible.
                 */
                if (positionOverlay(board)) {

                    /*
                     * Everything is now ready, so reveal it.
                     */
                    overlay.style.visibility =
                        'visible';
                }

            } else {

                overlay.style.display =
                    'none';

                overlay.style.visibility =
                    'hidden';
            }

        } else {

            // Restore normal board.
            board.style.filter =
                '';

            overlay.style.display =
                'none';

            overlay.style.visibility =
                'hidden';
        }

        return true;
    }


    // ============================================================
    // UI TOGGLE
    // ============================================================

    function createToggle() {

        if (
            document.getElementById(
                'variation-text-toggle'
            )
        ) {
            return;
        }

        const label =
            document.createElement('label');

        label.id =
            'variation-text-toggle';

        label.style.display =
            'flex';

        label.style.alignItems =
            'center';

        label.style.gap =
            '0.5em';

        label.style.cursor =
            'pointer';

        label.style.userSelect =
            'none';

        label.style.padding =
            '0.5em';


        const checkbox =
            document.createElement('input');

        checkbox.type =
            'checkbox';

        checkbox.checked =
            showVariationText;


        const caption =
            document.createElement('span');

        caption.textContent =
            'In variation show watermark';


        label.appendChild(checkbox);
        label.appendChild(caption);


        checkbox.addEventListener(
            'change',
            () => {

                showVariationText =
                    checkbox.checked;

                // Save preference.
                localStorage.setItem(
                    STORAGE_KEY,
                    showVariationText
                );

                update();
            }
        );


        // Add checkbox to Lichess analysis controls.
        const target =
            document.querySelector('.analyse__tools') ||
            document.querySelector('.analyse__controls') ||
            document.querySelector('.analyse__underboard');

        if (target) {
            target.appendChild(label);
        }
    }


    // ============================================================
    // RESIZE OBSERVER
    // ============================================================

    const resizeObserver =
        new ResizeObserver(() => {

            const board =
                document.querySelector('cg-board');

            const ctrl =
                page.lichess?.analysis?.navigate?.ctrl;

            if (
                board &&
                showVariationText &&
                ctrl?.onMainline === false
            ) {
                if (positionOverlay(board)) {
                    overlay.style.visibility =
                        'visible';
                }
            }
        });


    // ============================================================
    // WAIT FOR LICHESS
    // ============================================================

    const timer =
        setInterval(() => {

            if (update()) {

                clearInterval(timer);

                createToggle();

                const board =
                    document.querySelector('cg-board');

                if (board) {
                    resizeObserver.observe(board);
                }

                // Keep track of navigation through the Study.
                setInterval(update, 200);
            }

        }, 200);

})();
