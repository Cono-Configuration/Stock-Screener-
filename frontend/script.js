const API_QUOTE = 'http://localhost:8080/api/quote?symbol=';
const API_SEARCH = 'http://localhost:8080/api/search?q=';

// Watchlist holds an array of objects: { symbol: 'AAPL', name: 'Apple Inc' }
let watchlist = JSON.parse(localStorage.getItem('watchlist_full')) || [];

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchResultsBox = document.getElementById('search-results');
const resultsList = document.getElementById('results-list');
const watchlistTable = document.getElementById('watchlist-table-body');

// 1. Search Function
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    resultsList.innerHTML = '<li>Loading results...</li>';
    searchResultsBox.classList.remove('hidden');

    try {
        const response = await fetch(API_SEARCH + query);
        const data = await response.json();
        
        resultsList.innerHTML = '';
        
        // Finnhub search returns { result: [ {description, symbol}, ... ] }
        if (data.result && data.result.length > 0) {
            // Only show common stocks to keep it simple, limit to top 5
            const stocks = data.result.filter(r => r.type === 'Common Stock').slice(0, 5);
            
            if (stocks.length === 0) {
                resultsList.innerHTML = '<li>No common stocks found.</li>';
                return;
            }

            stocks.forEach(stock => {
                const li = document.createElement('li');
                
                const isAlreadyInWatchlist = watchlist.some(w => w.symbol === stock.symbol);
                
                li.innerHTML = `
                    <div class="result-info">
                        <strong>${stock.description}</strong>
                        <span style="color: var(--text-muted); font-size: 0.85em">${stock.symbol}</span>
                    </div>
                    <button class="add-btn ${isAlreadyInWatchlist ? 'added' : ''}" 
                            onclick="addToWatchlist('${stock.symbol}', '${stock.description.replace(/'/g, "\\'")}')">
                        ${isAlreadyInWatchlist ? 'Added' : 'Add to Watchlist'}
                    </button>
                `;
                resultsList.appendChild(li);
            });
        } else {
            resultsList.innerHTML = '<li>No results found.</li>';
        }
    } catch (error) {
        resultsList.innerHTML = '<li>Error fetching results. Is the Java backend running?</li>';
    }
}

// 2. Add to Watchlist
window.addToWatchlist = function(symbol, name) {
    if (!watchlist.some(w => w.symbol === symbol)) {
        watchlist.push({ symbol, name });
        localStorage.setItem('watchlist_full', JSON.stringify(watchlist));
        
        // Refresh Search UI and Table
        handleSearch();
        loadWatchlistPrices();
    }
}

// 3. Remove from Watchlist
window.removeFromWatchlist = function(symbol) {
    watchlist = watchlist.filter(w => w.symbol !== symbol);
    localStorage.setItem('watchlist_full', JSON.stringify(watchlist));
    loadWatchlistPrices();
}

// 4. Load Live Prices for Watchlist
async function loadWatchlistPrices() {
    if (watchlist.length === 0) {
        watchlistTable.innerHTML = '<tr><td colspan="5" class="loading">Your watchlist is empty. Search above to add stocks!</td></tr>';
        return;
    }

    watchlistTable.innerHTML = '<tr><td colspan="5" class="loading">Fetching live prices...</td></tr>';
    
    // Create an array to hold the fresh data
    const tableData = [];

    for (const item of watchlist) {
        try {
            const response = await fetch(API_QUOTE + item.symbol);
            const data = await response.json();
            
            if (data.c) {
                tableData.push({
                    symbol: item.symbol,
                    name: item.name,
                    price: data.c,
                    change: data.d,
                    percentChange: data.dp
                });
            }
        } catch (error) {
            console.error('Error fetching ' + item.symbol);
        }
    }
    
    renderTable(tableData);
}

// 5. Render Watchlist Table
function renderTable(data) {
    watchlistTable.innerHTML = '';

    if (data.length === 0) {
        watchlistTable.innerHTML = '<tr><td colspan="5" class="loading">Failed to load live data.</td></tr>';
        return;
    }

    data.forEach(stock => {
        const tr = document.createElement('tr');
        const changeClass = stock.change >= 0 ? 'positive' : 'negative';
        const sign = stock.change > 0 ? '+' : '';
        
        tr.innerHTML = `
            <td>
                <strong>${stock.name}</strong> 
                <div style="color: var(--text-muted); font-size: 0.85em;">${stock.symbol}</div>
            </td>
            <td>$${stock.price.toFixed(2)}</td>
            <td class="${changeClass}">${sign}${stock.change.toFixed(2)}</td>
            <td class="${changeClass}">${sign}${stock.percentChange.toFixed(2)}%</td>
            <td>
                <button class="star-btn active" onclick="removeFromWatchlist('${stock.symbol}')" title="Remove">★</button>
            </td>
        `;
        watchlistTable.appendChild(tr);
    });
}

// Events
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// Init
loadWatchlistPrices();
