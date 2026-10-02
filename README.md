# Simple Stock Screener

An ultra-simple stock screener for a college project.

## Project Structure
- `Server.java`: A 50-line Java backend that loads `.env` and proxies API requests to Finnhub. NO dependencies, NO maven.
- `frontend/`: Contains `index.html`, `style.css`, and `script.js`.
- `.env`: Holds the API key.

## How to Run

1. Open a terminal in this folder.
2. Compile the Java server: `javac Server.java`
3. Run the server: `java Server`
4. Open `frontend/index.html` in your web browser.

That's it!
