import Foundation

// MARK: - Network Error
enum NetworkError: Error {
    case invalidURL
    case noData
    case decodingError
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

// MARK: - Example API Endpoints Enum
public enum APIEndpoints {
    case getData(parameters: [String: String]?)
    case postData(body: Encodable)
    case updateData(id: String, body: Encodable)
}

// MARK: - APIEndpoint Implementation
extension APIEndpoints: APIEndpoint {
 
    public var baseURL: String {
        return "https://danitinez.github.io/" // Replace with your base URL
    }
    
    public var path: String {
        switch self {
        case .getData:
            return "/aic-caudales/latest.json"
        case .postData(body: let body):
            return "/aic-caudales"
        case .updateData(id: let id, body: let body):
            return "/aic-caudales"
        }
    }
    
    public var method: HTTPMethod {
        switch self {
        case .getData:
            return .get
        case .postData:
            return .post
        case .updateData:
            return .put
        }
    }
    
    public var headers: [String: String]? {
        // Common headers
        var headers = [
            "Content-Type": "application/json",
            "Accept": "application/json"
        ]
        
        // Add authorization if needed
        headers["Authorization"] = "Bearer YOUR_TOKEN"
        
        return headers
    }
    
    public var queryParameters: [String: String]? {
        switch self {
        case .getData(let parameters):
            return parameters
        default:
            return nil
        }
    }
    
    public var body: Data? {
        switch self {
        case .postData(let bodyData), .updateData(_, let bodyData):
            return try? JSONEncoder().encode(bodyData)
        default:
            return nil
        }
    }
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
            } catch {
                throw NetworkError.decodingError
            }
        default:
            throw NetworkError.serverError(httpResponse.statusCode)
        }
    }
}

// MARK: - Usage Example
struct ExampleResponse: Codable {
    let id: String
    let name: String
}

struct ExampleRequest: Codable {
    let name: String
}
