async function fetchHeadlines() {
    try {
        console.log('AAA');
        // Use a proxy to bypass CORS restrictions
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const targetUrls = [
            'https://sea.mashable.com/tech/',
            'https://sea.mashable.com/life/',
            'https://sea.mashable.com/science/',
            'https://sea.mashable.com/entertainment/',
            'https://sea.mashable.com/social-good/'
        ];

        const allHeadlines = [];

        const retryDelay = 2000; // 2 seconds delay between retries

        for (const targetUrl of targetUrls) {
            let currentPage = 1;
            let hasNextPage = true;

            while (hasNextPage) {
                try {
                    const response = await fetch(`${proxyUrl}${targetUrl}?page=${currentPage}`);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
                    }
                    const data = await response.json();
                    console.log('data :', data);

                    const html = data.contents;
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const articles = doc.querySelectorAll('.broll_info');
                    console.log('articles :', articles);

                    let articlesLoaded = 0;

                    articles.forEach(article => {
                        const titleElement = article.querySelector('.caption');
                        const title = titleElement ? titleElement.textContent.trim() : '';
                        console.log('title :', title);

                        const dateElement = article.querySelector('.datepublished');
                        const date = dateElement ? dateElement.textContent.trim() : '';
                        console.log('date :', date);

                        const linkElement = article.closest('a');
                        const link = linkElement ? linkElement.href : '';
                        console.log('link :', link);

                        // Convert the date string to a Date object
                        const publicationDate = new Date(date);

                        // Check if the publication date is after January 1, 2024
                        const januaryFirst2024 = new Date('2024-01-01');
                        if (publicationDate >= januaryFirst2024) {
                            allHeadlines.push({ title, date, link });
                        } else {
                            hasNextPage = false;
                            console.log('Reached January 1, 2024. Stopping further loading.');
                            return;
                        }

                        articlesLoaded++;
                    });

                    // Check if there are more pages to load, and if the date condition is met
                    const showMoreButton = doc.querySelector('#showmore');
                    if (showMoreButton) {
                        hasNextPage = hasNextPage && showMoreButton.style.display !== 'none';
                    } else {
                        console.log('Show more button not found. Stopping further loading.');
                        hasNextPage = false;
                    }

                    if (hasNextPage) {
                        // If there are more pages, increment currentPage and click "show more" button
                        currentPage++;
                        showMoreButton.click();
                        // Wait for a short delay to allow content to load
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } else {
                        console.log(`All articles loaded from ${targetUrl}`);
                    }
                } catch (error) {
                    console.error('Error fetching headlines:', error);
                    if (error instanceof TypeError && error.message === 'Failed to fetch') {
                        // Retry after a delay if it's a failed fetch due to rate-limiting
                        console.log(`Retrying after ${retryDelay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                    } else {
                        // For other types of errors, stop further processing
                        throw error;
                    }
                }
            }
        }

        // Sort all headlines by date
        allHeadlines.sort((a, b) => new Date(b.date) - new Date(a.date));

        console.log('All Headlines:', allHeadlines);

        return allHeadlines;
    } catch (error) {
        console.error('Error fetching headlines:', error);
        return [];
    }
}



async function displayHeadlines() {
    const headlinesContainer = document.getElementById('headlines');
    headlinesContainer.innerHTML = ''; 

    const sortedHeadlines = await fetchHeadlines();

    // Filter headlines published from 1st of January 2024 onwards
    const filteredHeadlines = sortedHeadlines.filter(headline => {
        const publicationDate = new Date(headline.date);
        const januaryFirst2024 = new Date('2024-01-01');
        return publicationDate >= januaryFirst2024;
    });

    console.log('filteredHeadlines :', filteredHeadlines);

    // Display filtered headlines in reverse chronological order
    const displayFilteredHeadlines = (headlines, containerId) => {
        const container = document.getElementById(containerId);
        headlines.forEach(headline => {
            const headlineElement = document.createElement('li');
            headlineElement.classList.add('blogroll', 'ARTICLE');
    
            const headlineLink = document.createElement('a');
            headlineLink.href = headline.link; 
            headlineLink.target = "_blank"; 
            headlineElement.appendChild(headlineLink);
    
            const headlineInfo = document.createElement('div');
            headlineInfo.classList.add('broll_info');
            headlineLink.appendChild(headlineInfo);
    
            const titleElement = document.createElement('div');
            titleElement.classList.add('caption');
            titleElement.textContent = headline.title;
            headlineInfo.appendChild(titleElement);
    
            const dateElement = document.createElement('time');
            dateElement.classList.add('datepublished');
            dateElement.textContent = headline.date;
            headlineInfo.appendChild(dateElement);
    
            container.appendChild(headlineElement);
        });
    };

    displayFilteredHeadlines(filteredHeadlines, 'headlines');
}

// Load headlines when the page is loaded
window.onload = displayHeadlines;