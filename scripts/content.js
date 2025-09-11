const observer = new MutationObserver(() => {
    applyMenuMutation();
});

observer.observe(document.body, { childList: true, subtree: true });
