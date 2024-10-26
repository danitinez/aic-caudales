import Foundation
import Observation

@Observable
public class RioViewModel {
    
    var rio: Rio
    
    public init() {
        self.rio = Rio.createRio()
    }
    
}
