// List of stocks we want to display
const STOCK_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'NFLX'];

const API_URL = 'http://localhost:8080/api/quote?symbol=';
let stockData = [];
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
let showOnlyWatchlist = false;

const tableBody = document.getElementById('stock-table-body');
const searchInput = document.getElementById('search-input');
const watchlistToggle = document.getElementById('watchlist-toggle');

// Load data when page opens
async function fetchAllStocks() {
    stockData = [];
    tableBody.innerHTML = '<tr><td colspan="5" class="loading">Fetching live data...</td></tr>';
    
    for (const symbol of STOCK_SYMBOLS) {
        try {
            const response = await fetch(API_URL + symbol);
            const data = await response.json();
            
            // Finnhub returns 'c' for current price
            if (data.c) {
                stockData.push({
                    symbol: symbol,
                    price: data.c,
                    change: data.d,
                    percentChange: data.dp
                });
            }
        } catch (error) {
            console.error('Error fetching ' + symbol, error);
        }
    }
    
    renderTable();
}

// Draw the table
function renderTable() {
    tableBody.innerHTML = '';
    const searchTerm = searchInput.value.toUpperCase();

    // Filter stocks
    const filteredStocks = stockData.filter(stock => {
        const matchesSearch = stock.symbol.includes(searchTerm);
        const inWatchlist = watchlist.includes(stock.symbol);
        
        if (showOnlyWatchlist && !inWatchlist) return false;
        return matchesSearch;
    });

    if (filteredStocks.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="loading">No stocks found.</td></tr>';
        return;
    }

    filteredStocks.forEach(stock => {
        const tr = document.createElement('tr');
        const changeClass = stock.change >= 0 ? 'positive' : 'negative';
        const sign = stock.change > 0 ? '+' : '';
        const isWatchlisted = watchlist.includes(stock.symbol);
        
        tr.innerHTML = `
            <td><strong>${stock.symbol}</strong></td>
            <td>$${stock.price.toFixed(2)}</td>
            <td class="${changeClass}">${sign}${stock.change.toFixed(2)}</td>
            <td class="${changeClass}">${sign}${stock.percentChange.toFixed(2)}%</td>
            <td>
                <button class="star-btn ${isWatchlisted ? 'active' : ''}" onclick="toggleWatchlist('${stock.symbol}')">★</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// Watchlist Logic
function toggleWatchlist(symbol) {
    if (watchlist.includes(symbol)) {
        // Remove it
        watchlist = watchlist.filter(s => s !== symbol);
    } else {
        // Add it
        watchlist.push(symbol);
    }
    
    // Save to LocalStorage
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    renderTable(); // Re-draw
}

// Event Listeners
searchInput.addEventListener('input', renderTable);

watchlistToggle.addEventListener('click', () => {
    showOnlyWatchlist = !showOnlyWatchlist;
    if (showOnlyWatchlist) {
        watchlistToggle.textContent = 'Show All Stocks';
        watchlistToggle.classList.add('active');
    } else {
        watchlistToggle.textContent = 'Show Watchlist';
        watchlistToggle.classList.remove('active');
    }
    renderTable();
});

// Start the app
fetchAllStocks();
