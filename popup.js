document.addEventListener('DOMContentLoaded', () => {
    const autopauseToggle = document.getElementById('autopause-toggle');
    const autoplayToggle = document.getElementById('autoplay-toggle');
    const focusThemeToggle = document.getElementById('focus-theme-toggle');
    const speedControl = document.getElementById('speed-control');
    const speedValue = document.getElementById('speed-value');
    const saveBookmarkButton = document.getElementById('save-bookmark');
    const skipForwardButton = document.getElementById('skip-forward');  // Skip Forward button
    const bookmarkList = document.getElementById('bookmarks-list');
    const clearAllBookmarksButton = document.getElementById('clear-all-bookmarks');

    // Load saved preferences
    chrome.storage.sync.get(['autopause', 'autoplay', 'focusTheme', 'videoSpeed', 'bookmarks'], (result) => {
        autopauseToggle.checked = result.autopause || false;
        autoplayToggle.checked = result.autoplay || false;
        focusThemeToggle.checked = result.focusTheme || false;
        speedControl.value = result.videoSpeed || 1;
        speedValue.textContent = `${result.videoSpeed || 1}x`;

        // Display saved bookmarks
        const bookmarks = result.bookmarks || [];
        displayBookmarks(bookmarks);
    });

    // Save preferences on toggle
    autopauseToggle.addEventListener('change', () => {
        chrome.storage.sync.set({ autopause: autopauseToggle.checked });
    });

    autoplayToggle.addEventListener('change', () => {
        chrome.storage.sync.set({ autoplay: autoplayToggle.checked });
    });

    focusThemeToggle.addEventListener('change', () => {
        const isEnabled = focusThemeToggle.checked;
        chrome.storage.sync.set({ focusTheme: isEnabled });
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleFocusTheme', enable: isEnabled });
        });
    });

    // Video Speed Control
    speedControl.addEventListener('input', () => {
        const speed = parseFloat(speedControl.value);
        speedValue.textContent = `${speed}x`;

        // Save video speed preference
        chrome.storage.sync.set({ videoSpeed: speed });

        // Send message to the content script to change the video speed
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'setVideoSpeed', speed: speed });
            }
        });
    });

    // Save bookmark action
    saveBookmarkButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'saveBookmark' }, (response) => {
                if (response && response.success) {
                    alert('Bookmark saved!');
                    // Reload the bookmarks after saving
                    loadBookmarks();
                } else {
                    alert('Failed to save bookmark!');
                }
            });
        });
    });

    // Skip forward action
    skipForwardButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'skipForward' });
        });
    });

    // Clear all bookmarks action
    clearAllBookmarksButton.addEventListener('click', () => {
        chrome.storage.sync.set({ bookmarks: [] });
        loadBookmarks();
    });

    // Display saved bookmarks
    const displayBookmarks = (bookmarks) => {
        bookmarkList.innerHTML = '';  // Clear the existing list
        bookmarks.forEach((bookmark, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${bookmark.title} - ${formatTime(bookmark.time)}`;

            // Create delete button for each bookmark
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => {
                deleteBookmark(index);
            });

            listItem.appendChild(deleteButton);
            bookmarkList.appendChild(listItem);
        });
    };

    // Delete a bookmark
    const deleteBookmark = (index) => {
        chrome.storage.sync.get(['bookmarks'], (result) => {
            const bookmarks = result.bookmarks || [];
            bookmarks.splice(index, 1); // Remove the bookmark at the specified index
            chrome.storage.sync.set({ bookmarks: bookmarks });
            loadBookmarks();  // Reload the bookmarks after deletion
        });
    };

    // Function to format time (e.g., 90 seconds -> 1:30)
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secondsFormatted = Math.floor(seconds % 60);
        return `${minutes}:${secondsFormatted < 10 ? '0' : ''}${secondsFormatted}`;
    };

    // Load the bookmarks from chrome storage
    const loadBookmarks = () => {
        chrome.storage.sync.get(['bookmarks'], (result) => {
            const bookmarks = result.bookmarks || [];
            displayBookmarks(bookmarks);
        });
    };
});
