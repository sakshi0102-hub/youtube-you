(function() {
    let bookmarks = [];

    // Autopause when tab is not active
    document.addEventListener('visibilitychange', () => {
        const video = document.querySelector('video');
        if (video) {
            if (document.hidden) {
                video.pause();
            } else {
                video.play();
            }
        }
    });

    // Focus Theme: Hide non-essential elements
    const toggleFocusTheme = (enable) => {
        const elementsToHide = [
            '#comments', // Comments section
            '#secondary', // Recommended videos
            'ytd-merch-shelf-renderer', // Merch shelf
            'ytd-guide-section-renderer', // Side navigation
            'ytd-video-primary-info-renderer + ytd-video-secondary-info-renderer' // Description box
        ];

        elementsToHide.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.display = enable ? 'none' : '';
            }
        });
    };

    // Save bookmark (current video time and title)
    const saveBookmark = () => {
        const video = document.querySelector('video');
        const title = document.title;  // Get video title
        const currentTime = video.currentTime;  // Get current timestamp

        // Save bookmark if video is playing
        if (video && title) {
            bookmarks.push({ title, time: currentTime });
            chrome.storage.sync.set({ bookmarks: bookmarks });
            return { success: true };
        }
        return { success: false };
    };

    // Retrieve and display saved bookmarks from storage
    const getBookmarks = () => {
        chrome.storage.sync.get(['bookmarks'], (result) => {
            bookmarks = result.bookmarks || [];
        });
    };

    // Function to jump to a specific bookmark in the video
    const jumpToBookmark = (time) => {
        const video = document.querySelector('video');
        if (video) {
            video.currentTime = time;
            video.play();
        }
    };

    // Listen for messages from the popup to toggle Focus Theme, adjust video speed, or manage bookmarks
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'toggleFocusTheme') {
            toggleFocusTheme(message.enable);
        } else if (message.action === 'setVideoSpeed') {
            const video = document.querySelector('video');
            if (video) {
                video.playbackRate = message.speed; // Change video speed
            }
        } else if (message.action === 'saveBookmark') {
            const result = saveBookmark();
            sendResponse(result);  // Respond back to popup.js with success or failure
        } else if (message.action === 'jumpToBookmark') {
            jumpToBookmark(message.time);  // Jump to a saved bookmark time
        }
    });

    // Initialize the bookmarks list
    getBookmarks();
})();
// Listen for the skipForward action from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'skipForward') {
        const video = document.querySelector('video');
        
        if (video) {
            const currentTime = video.currentTime;
            const videoSpeed = video.playbackRate;  // Get the current video speed
            const skipTime = videoSpeed * 10; // Skip forward 10 seconds, adjusted by video speed

            video.currentTime = currentTime + skipTime;
        }
    }
});
