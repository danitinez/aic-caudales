import Foundation
import AicNetwork

// MARK: - Example API Endpoints Enum
public enum APIEndpoints {
    case getData(parameters: [String: String]?)
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
        }
    }
    
    public var method: HTTPMethod {
        switch self {
        case .getData:
            return .get
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
        }
    }
    
    public var body: Data? {
        return nil
    }
}
