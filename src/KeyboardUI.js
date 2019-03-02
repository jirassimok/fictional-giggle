/**
 * Get a keyboard key in the user interface by key name, as given by
 * {@link KeyboardEvent.key}, case-insensitive.
 */
function uiKey(key) {
    if (typeof key === "string") {
        key = keyToClass(key);
        return document.querySelector(`kbd.key.${key}`);
    }
    else {
        return key;
    }
}

const KEY_NAMES = new Map()
      .set(' ', 'SPACE')
      .set('.', 'PERIOD')
      .set(',', 'COMMA')
      .set(';', 'SEMICOLON')
      .set("'", 'APOSTROPHE')
      .set("!", 'EXCLAMATION_MARK')
      .set("#", 'POUND');

/**
 * Get the CSS class for a key
 *
 * Includes a limited subset of ASCII identifiers.
 */
function keyToClass(key) {
    if (/^[A-Za-z_]/.test(key)) {
        return key;
    } else if (/^\d/.test(key)) {
        return '_' + key; // prefix numbers with an underscore
    }
    else {
        return KEY_NAMES.get(key);
    }
}

/**
 * Add the activation hightlight to one key and optionally remove it from another
 * @param {String} key The key to highlight
 * @param {?String} offKey A key to un-highlight
 *
 * @see activateKey
 * @see deactivateKey
 */
export function activate(key, offKey = null) {
    key = uiKey(key);
    if (key) {
        key.classList.add("active");
    }

    if (offKey) {
        deactivate(offKey);
    }
}

/**
 * Toggle the activation highlight for a keyboard control in the UI
 *
 * @param {String} key The key to toggle
 * @param {?String} offKey A key to deactivate if the toggled key is turned on
 * @param {?boolean} [disableShared=false] whether to disabled shared keys
 *
 * If the key has the {@code shared} CSS class and {@code disableShared} is
 * true, deactivate all other keys with that class.
 */
export function toggle(key, offKey = null, disableShared = false) {
    key = uiKey(key);
    if (key) {
        let active = key.classList.toggle("active");
        if (disableShared && key.classList.contains("shared")) {
            deactivateSelector(".shared");
        }
        if (active) {
            activate(key);
            if (offKey) {
                deactivate(offKey);
            }
        }
    }
}

/**
 * Remove the activation highlight from a keyboard control in the UI
 */
export function deactivate(key) {
    key = uiKey(key);
    if (key) {
        key.classList.remove("active");
    }
}

/**
 * Remove highlighting from all keys in the user interface
 */
export function deactivateAll() {
    deactivateSelector("*");
}

/**
 * Remove highlighting form all keys with the given class
 */
export function deactivateClass(classname) {
    deactivateSelector(`.${classname}`);
}

/**
 * Remove highlighting from keys matching a DOM selector
 *
 * Appends {@code .key} to the selector.
 */
export function deactivateSelector(selector) {
    document.querySelectorAll(`${selector}.key`).forEach(k => k.classList.remove("active"));
}
