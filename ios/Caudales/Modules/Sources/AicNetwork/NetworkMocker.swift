import Foundation


// MARK: - Mock Network Service
class MockNetworkServiceJson: NetworkServiceProtocol {
    enum MockError: Error {
        case fileNotFound
        case invalidFileURL
    }
    
    private let bundle: Bundle
    private let defaultDelay: TimeInterval
    
    init(bundle: Bundle = .main, defaultDelay: TimeInterval = 0.5) {
        self.bundle = bundle
        self.defaultDelay = defaultDelay
    }
    
    func execute<T: Decodable>(endpoint: APIEndpoint) async throws -> T {
        // Simulate network delay
        try await Task.sleep(nanoseconds: UInt64(defaultDelay * 1_000_000_000))
        
        // Generate filename based on endpoint
        let filename = generateMockFilename(for: endpoint)
        
        // Get file URL
        guard let fileURL = bundle.url(forResource: filename, withExtension: "json") else {
            throw MockError.fileNotFound
        }
        
        // Read and decode data
        do {
            let data = try Data(contentsOf: fileURL)
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            return try decoder.decode(T.self, from: data)
        } catch {
            throw error
        }
    }
    
    private func generateMockFilename(for endpoint: APIEndpoint) -> String {
        // Convert endpoint path to filename
        // Remove leading slash and replace remaining slashes with underscores
        var filename = endpoint.path.replacingOccurrences(of: "/", with: "_")
        if filename.hasPrefix("_") {
            filename.removeFirst()
        }
        
        // Add HTTP method to filename
        filename = "\(filename)_\(endpoint.method.rawValue.lowercased())"
        
        // Add query parameters to filename if they exist
        if let params = endpoint.queryParameters {
            let sortedParams = params.keys.sorted().compactMap { key in
                guard let value = params[key] else { return nil }
                return "\(key)_\(value)"
            }.joined(separator: "_")
            
            if !sortedParams.isEmpty {
                filename += "_\(sortedParams)"
            }
        }
        
        return filename
    }
}

// MARK: - Mock Response Provider
struct MockResponseProvider {
    static func saveMockResponse<T: Encodable>(
        response: T,
        forEndpoint endpoint: APIEndpoint,
        toDirectory directory: URL
    ) throws {
        let filename = generateMockFilename(for: endpoint)
        let fileURL = directory.appendingPathComponent("\(filename).json")
        
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        let data = try encoder.encode(response)
        
        try data.write(to: fileURL)
    }
    
    private static func generateMockFilename(for endpoint: APIEndpoint) -> String {
        var filename = endpoint.path.replacingOccurrences(of: "/", with: "_")
        if filename.hasPrefix("_") {
            filename.removeFirst()
        }
        filename = "\(filename)_\(endpoint.method.rawValue.lowercased())"
        
        if let params = endpoint.queryParameters {
            let sortedParams = params.keys.sorted().compactMap { key in
                guard let value = params[key] else { return nil }
                return "\(key)_\(value)"
            }.joined(separator: "_")
            
            if !sortedParams.isEmpty {
                filename += "_\(sortedParams)"
            }
        }
        
        return filename
    }
}
