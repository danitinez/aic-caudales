import SwiftUI
import Rios

struct ContentView: View {

    @State var viewModel = RioViewModel()
    
    var body: some View {
        ScrollView {
            VStack {
                RioView(vm: viewModel)
                RioView(vm: viewModel)
                RioView(vm: viewModel)
            }.padding(.horizontal, 20)
        }
        
        
    }
    
   
}

#Preview {
    ContentView()
}
