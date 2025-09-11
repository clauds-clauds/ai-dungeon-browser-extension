function getAdventureId() {
    const match = window.location.pathname.match(/adventure\/([^\/]+)/);
    return match ? match[1] : null;
}

const observer = new MutationObserver(() => {
    applyMenuMutation();
});

observer.observe(document.body, { childList: true, subtree: true });
