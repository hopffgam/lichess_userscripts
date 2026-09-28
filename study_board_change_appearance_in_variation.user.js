// ==UserScript==
// @name         Lichess Study Board Change Appearance in Variation
// @namespace    https://lichess.org/
// @version      1.0
// @description  Changes the board appearance in lichess studies when board shows a move that is in a variation instead of the main line
// @match        https://lichess.org/study/*
// @match        https://lichess.org/broadcast/*
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const page = unsafeWindow;

    // ============================================================
    // SETTINGS
    // ============================================================

    const TEXT_OPACITY_KEY =
        'lichess-variation-text-opacity';

    const BOARD_PALE_KEY =
        'lichess-variation-board-pale';

    const TEXT_BOARD_WIDTH =
        2 / 3;

    const TEXT_COLOR =
        'rgba(120, 120, 120, 1)';

    // Defaults:
    // Text: 2/10 = 20% opaque
    // Board: 5/10 = moderately pale
    let textOpacity =
        Number(localStorage.getItem(TEXT_OPACITY_KEY) ?? 2);

    let boardPale =
        Number(localStorage.getItem(BOARD_PALE_KEY) ?? 5);


    // ============================================================
    // CREATE VARIATION TEXT
    // ============================================================

    const overlay =
        document.createElement('div');

    overlay.textContent =
        'VARIATION';

    Object.assign(overlay.style, {
        position: 'fixed',
        zIndex: '10',
        pointerEvents: 'none',
        fontFamily: 'sans-serif',
        fontSize: '100px',
        fontWeight: 'bold',
        letterSpacing: '0.08em',
        color: TEXT_COLOR,
        whiteSpace: 'nowrap',
        display: 'none',
        visibility: 'hidden',
        transform: 'translate(-50%, -50%)'
    });

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

        // Keep rendered but invisible while measuring.
        overlay.style.display =
            'block';

        overlay.style.visibility =
            'hidden';

        overlay.style.fontSize =
            '100px';

        const textWidth =
            overlay.getBoundingClientRect().width;

        if (textWidth <= 0) {
            return false;
        }

        const targetWidth =
            rect.width * TEXT_BOARD_WIDTH;

        const fontSize =
            100 * targetWidth / textWidth;

        overlay.style.fontSize =
            fontSize + 'px';

        overlay.style.left =
            (rect.left + rect.width / 2) + 'px';

        overlay.style.top =
            (rect.top + rect.height / 2) + 'px';

        return true;
    }


    // ============================================================
    // BOARD APPEARANCE
    // ============================================================

    function updateBoardAppearance(board) {

        if (boardPale === 0) {
            board.style.filter = '';
            return;
        }

        const level =
            boardPale / 10;

        /*
         * 0:
         *   Completely unchanged.
         *
         * 10:
         *   Much paler, with reduced saturation,
         *   increased brightness and a slight sepia tone.
         */
        const sepia =
            0.6 * level;

        const saturation =
            1 - 0.6 * level;

        const brightness =
            1 + 0.5 * level;

        board.style.filter =
            `sepia(${sepia}) ` +
            `saturate(${saturation}) ` +
            `brightness(${brightness})`;
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

            // ----------------------------------------------------
            // BOARD
            // ----------------------------------------------------

            updateBoardAppearance(board);


            // ----------------------------------------------------
            // TEXT
            // ----------------------------------------------------

            if (textOpacity > 0) {

                if (positionOverlay(board)) {

                    overlay.style.opacity =
                        textOpacity / 10;

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

            // ----------------------------------------------------
            // MAINLINE
            // ----------------------------------------------------

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
    // UI
    // ============================================================

    function createSlider(
        id,
        labelText,
        value,
        onChange
    ) {

        if (document.getElementById(id)) {
            return;
        }

        const container =
            document.createElement('label');

        container.id =
            id;

        Object.assign(container.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5em',
            cursor: 'pointer',
            userSelect: 'none',
            padding: '0.5em'
        });


        const caption =
            document.createElement('span');

        caption.textContent =
            labelText;


        const slider =
            document.createElement('input');

        slider.type =
            'range';

        slider.min =
            '0';

        slider.max =
            '10';

        slider.step =
            '1';

        slider.value =
            value;


        const valueDisplay =
            document.createElement('span');

        valueDisplay.textContent =
            value;

        valueDisplay.style.minWidth =
            '1.2em';

        valueDisplay.style.textAlign =
            'center';


        slider.addEventListener(
            'input',
            () => {

                const newValue =
                    Number(slider.value);

                valueDisplay.textContent =
                    newValue;

                onChange(newValue);
            }
        );


        container.append(
            caption,
            slider,
            valueDisplay
        );


        const target =
            document.querySelector('.analyse__tools') ||
            document.querySelector('.analyse__controls') ||
            document.querySelector('.analyse__underboard');

        if (target) {
            target.appendChild(container);
        }
    }


    function createControls() {

        createSlider(
            'variation-text-opacity',
            'Variation text',
            textOpacity,
            value => {

                textOpacity =
                    value;

                localStorage.setItem(
                    TEXT_OPACITY_KEY,
                    value
                );

                update();
            }
        );


        createSlider(
            'variation-board-pale',
            'Variation board',
            boardPale,
            value => {

                boardPale =
                    value;

                localStorage.setItem(
                    BOARD_PALE_KEY,
                    value
                );

                update();
            }
        );
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
                textOpacity > 0 &&
                ctrl?.onMainline === false
            ) {
                if (positionOverlay(board)) {

                    overlay.style.opacity =
                        textOpacity / 10;

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

                createControls();

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
