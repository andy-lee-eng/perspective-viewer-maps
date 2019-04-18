const themes = window["theme-toggle-themes"] || [{color: "white", files: []}, {color: "black", files: ["material.dark", "template.plugin.dark"]}];

let themeIndex = 0;
themes.forEach((theme, index) => {
    if (theme.files.length && hasStylesheet(theme.files[0])) {
        themeIndex = index;
    }
});
const nextThemeIndex = () => (themeIndex >= themes.length - 1 ? 0 : themeIndex + 1);
const thisTheme = () => themes[themeIndex];
const nextTheme = () => themes[nextThemeIndex()];

const header = document.getElementsByTagName("head")[0];
const style = document.createElement("style");
style.innerHTML = `
    .theme-toggle {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 20px;
        height: 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }
`;
header.appendChild(style);

const toggleButton = document.createElement("button");
toggleButton.className = "theme-toggle";
toggleButton.addEventListener("click", () => {
    thisTheme().files.forEach(removeStylesheet);
    themeIndex = nextThemeIndex();
    Promise.all(thisTheme().files.map(addStylesheet)).then(refreshView);
});
styleButton();

document.body.appendChild(toggleButton);

function addStylesheet(name) {
    return new Promise(resolve => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `/${name}.css`;
        link.is = "custom-style";
        link.onload = () => resolve();
        header.appendChild(link);
    });
}

function removeStylesheet(name) {
    const links = document.getElementsByTagName("link");
    for (let n = 0; n < links.length; n++) {
        const link = links[n];
        if (link.href.endsWith(`${name}.css`)) {
            header.removeChild(link);
        }
    }
}

function refreshView() {
    const viewers = document.getElementsByTagName("perspective-viewer");
    for (let n = 0; n < viewers.length; n++) {
        const viewer = viewers[n];
        viewer.restore({});
    }
    styleButton();
}

function styleButton() {
    toggleButton.style.backgroundColor = nextTheme().color;
}

function hasStylesheet(name) {
    const links = document.getElementsByTagName("link");
    for (let n = 0; n < links.length; n++) {
        const link = links[n];
        if (link.href.endsWith(`${name}.css`)) {
            return true;
        }
    }
    return false;
}

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(search, this_len) {
        if (this_len === undefined || this_len > this.length) {
            this_len = this.length;
        }
        return this.substring(this_len - search.length, this_len) === search;
    };
}
