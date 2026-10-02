import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpExchange;

import java.io.FileInputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Properties;

public class Server {
    public static void main(String[] args) throws Exception {
        // 1. Read API Key from .env manually (No external libraries needed)
        Properties env = new Properties();
        try {
            env.load(new FileInputStream(".env"));
        } catch (Exception e) {
            System.out.println("Could not find .env file. Ensure it exists.");
        }
        String apiKey = env.getProperty("STOCK_API_KEY", "");

        if (apiKey.isEmpty()) {
            System.out.println("Error: STOCK_API_KEY is empty.");
            return;
        }

        // 2. Start Java built-in HTTP Server
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        
        server.createContext("/api/quote", (HttpExchange exchange) -> {
            // Enable CORS for frontend
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            
            // Get symbol from query (e.g., symbol=AAPL)
            String query = exchange.getRequestURI().getQuery();
            
            try {
                // 3. Call Finnhub API directly
                String finnhubUrl = "https://finnhub.io/api/v1/quote?" + query + "&token=" + apiKey;
                HttpClient client = HttpClient.newHttpClient();
                HttpRequest request = HttpRequest.newBuilder().uri(URI.create(finnhubUrl)).build();
                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                
                // 4. Send exact Finnhub JSON response back to frontend
                byte[] responseBytes = response.body().getBytes();
                exchange.sendResponseHeaders(200, responseBytes.length);
                OutputStream os = exchange.getResponseBody();
                os.write(responseBytes);
                os.close();
                System.out.println("Fetched data for: " + query);
                
            } catch(Exception e) {
                exchange.sendResponseHeaders(500, 0);
                exchange.getResponseBody().close();
                System.out.println("Error fetching data.");
            }
        });

        server.start();
        System.out.println("=========================================");
        System.out.println("Simple Java Backend is running!");
        System.out.println("Port: 8080");
        System.out.println("API Key loaded successfully.");
        System.out.println("=========================================");
    }
}
