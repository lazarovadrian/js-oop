const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const SOCIAL_DOMAINS = {
    google: ['google.com', 'youtube.com', 'g.co', 'goo.gl'],
    facebook: ['facebook.com', 'fb.com', 'm.me', 'facebook.watch'],
    twitter: ['twitter.com', 'x.com', 't.co'],
    instagram: ['instagram.com', 'instagr.am']
};

async function fetchPage(url, visited = new Set()) {
    const results = {
        google: [],
        facebook: [],
        twitter: [],
        instagram: []
    };

    try {
        // Normalize URL
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        const visitedKey = url.toLowerCase().replace(/\/$/, '');
        
        if (visited.has(visitedKey)) {
            return results;
        }
        
        visited.add(visitedKey);

        console.log(`Analyzing: ${url}`);

        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            maxRedirects: 5
        });

        const $ = cheerio.load(response.data);
        const baseUrl = new URL(url);

        // Find all links
        $('a[href]').each((i, element) => {
            const href = $(element).attr('href');
            if (!href) return;

            // Check for social media links
            for (const [platform, domains] of Object.entries(SOCIAL_DOMAINS)) {
                for (const domain of domains) {
                    if (href.includes(domain)) {
                        results[platform].push({
                            url: href,
                            page: url,
                            text: $(element).text().trim().substring(0, 100)
                        });
                        break;
                    }
                }
            }
        });

        // Also check meta tags and Open Graph
        $('meta[property], meta[name]').each((i, element) => {
            const property = $(element).attr('property') || $(element).attr('name');
            const content = $(element).attr('content');
            
            if (!content) return;

            for (const [platform, domains] of Object.entries(SOCIAL_DOMAINS)) {
                for (const domain of domains) {
                    if (content.includes(domain)) {
                        results[platform].push({
                            url: content,
                            page: url,
                            text: `Meta tag: ${property}`
                        });
                        break;
                    }
                }
            }
        });

    } catch (error) {
        console.error(`Error fetching ${url}:`, error.message);
    }

    return results;
}

function mergeResults(allResults, newResults) {
    for (const platform in newResults) {
        for (const link of newResults[platform]) {
            const exists = allResults[platform].some(
                item => item.url === link.url && item.page === link.page
            );
            if (!exists) {
                allResults[platform].push(link);
            }
        }
    }
}

app.post('/api/analyze', async (req, res) => {
    try {
        let { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Normalize URL
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        const allResults = {
            google: [],
            facebook: [],
            twitter: [],
            instagram: []
        };

        const visited = new Set();
        
        // Analyze main page
        const mainResults = await fetchPage(url, visited);
        mergeResults(allResults, mainResults);

        // Get internal links for deeper analysis (limit to avoid too many requests)
        try {
            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            const $ = cheerio.load(response.data);
            const baseUrl = new URL(url);
            
            const internalLinks = [];
            $('a[href]').each((i, element) => {
                const href = $(element).attr('href');
                if (!href || href.startsWith('#')) return;
                
                try {
                    const fullUrl = new URL(href, baseUrl).href;
                    if (fullUrl.startsWith(baseUrl.origin) && !visited.has(fullUrl.replace(/\/$/, '').toLowerCase())) {
                        internalLinks.push(fullUrl);
                    }
                } catch (e) {
                    // Invalid URL, skip
                }
            });

            // Analyze up to 10 internal pages
            const pagesToAnalyze = internalLinks.slice(0, 10);
            for (const internalUrl of pagesToAnalyze) {
                const results = await fetchPage(internalUrl, visited);
                mergeResults(allResults, results);
                // Small delay to be respectful
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (error) {
            console.error('Error analyzing internal links:', error.message);
        }

        // Calculate statistics
        const stats = {
            total: 0,
            byPlatform: {}
        };

        for (const platform in allResults) {
            stats.byPlatform[platform] = allResults[platform].length;
            stats.total += allResults[platform].length;
        }

        res.json({
            success: true,
            analyzedUrl: url,
            statistics: stats,
            data: allResults
        });

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ 
            error: 'Failed to analyze website',
            message: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
