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
        // 1. Read API Key
        Properties env = new Properties();
        try {
            env.load(new FileInputStream(".env"));
        } catch (Exception e) {
            System.out.println("Could not find .env file.");
        }
        String apiKey = env.getProperty("STOCK_API_KEY", "");

        if (apiKey.isEmpty()) {
            System.out.println("Error: STOCK_API_KEY is empty.");
            return;
        }

        // 2. Start Server
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        
        // Handle BOTH /api/quote and /api/search
        server.createContext("/api/", (HttpExchange exchange) -> {
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            
            String path = exchange.getRequestURI().getPath(); // /api/quote or /api/search
            String query = exchange.getRequestURI().getQuery(); // symbol=AAPL or q=apple
            
            String finnhubUrl = "";
            if (path.equals("/api/quote")) {
                finnhubUrl = "https://finnhub.io/api/v1/quote?" + query + "&token=" + apiKey;
            } else if (path.equals("/api/search")) {
                finnhubUrl = "https://finnhub.io/api/v1/search?" + query + "&token=" + apiKey;
            } else {
                exchange.sendResponseHeaders(404, -1);
                return;
            }
            
            try {
                // Call Finnhub
                HttpClient client = HttpClient.newHttpClient();
                HttpRequest request = HttpRequest.newBuilder().uri(URI.create(finnhubUrl)).build();
                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                
                // Return exact JSON to frontend
                byte[] responseBytes = response.body().getBytes();
                exchange.sendResponseHeaders(200, responseBytes.length);
                OutputStream os = exchange.getResponseBody();
                os.write(responseBytes);
                os.close();
                
            } catch(Exception e) {
                exchange.sendResponseHeaders(500, 0);
                exchange.getResponseBody().close();
            }
        });

        server.start();
        System.out.println("Backend running on port 8080");
    }
}
