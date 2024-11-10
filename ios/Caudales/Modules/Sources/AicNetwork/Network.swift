import Foundation

// MARK: - Network Error
public enum NetworkError: Error {
    case invalidURL
    case noData
    case decodingError(String)
    case serverError(Int)
    case custom(String)
}

// MARK: - HTTP Method
public enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
    case patch = "PATCH"
}

// MARK: - API Endpoint Protocol
public protocol APIEndpoint {
    var baseURL: String { get }
    var path: String { get }
    var method: HTTPMethod { get }
    var headers: [String: String]? { get }
    var queryParameters: [String: String]? { get }
    var body: Data? { get }
}




// MARK: - Network Service
public protocol NetworkServiceProtocol {
    func execute<T: Decodable>(endpoint: APIEndpoint) async throws -> T
}

public class NetworkService: NetworkServiceProtocol {
    private let urlSession: URLSession
    
    public init(urlSession: URLSession = .shared) {
        self.urlSession = urlSession
    }
    
    public func execute<T: Decodable>(endpoint: APIEndpoint) async throws -> T {
        // Construct URL with query parameters
        guard var urlComponents = URLComponents(string: endpoint.baseURL + endpoint.path) else {
            throw NetworkError.invalidURL
        }
        
        // Add query parameters if they exist
        if let queryParameters = endpoint.queryParameters {
            urlComponents.queryItems = queryParameters.map {
                URLQueryItem(name: $0.key, value: $0.value)
            }
        }
        
        guard let url = urlComponents.url else {
            throw NetworkError.invalidURL
        }
        
        // Create URL request
        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method.rawValue
        request.allHTTPHeaderFields = endpoint.headers
        request.httpBody = endpoint.body
        
        // Execute request
        let (data, response) = try await urlSession.data(for: request)
        
        // Handle response
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.custom("Invalid response")
        }
        
        // Check status code
        switch httpResponse.statusCode {
        case 200...299:
            do {
                let decoder = JSONDecoder()
                decoder.keyDecodingStrategy = .convertFromSnakeCase
                return try decoder.decode(T.self, from: data)
            } catch let error as DecodingError {
                throw NetworkError.decodingError(String(describing: error))
            } catch {
                throw NetworkError.custom(error.localizedDescription)
            }

        default:
            throw NetworkError.serverError(httpResponse.statusCode)
        }
    }
}

//// MARK: - Usage Example
//struct ExampleResponse: Codable {
//    let id: String
//    let name: String
//}
//
//struct ExampleRequest: Codable {
//    let name: String
//}
