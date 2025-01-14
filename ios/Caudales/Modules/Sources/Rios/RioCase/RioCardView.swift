import SwiftUI
import Charts

public struct RioCardView: View {
    let viewmodel: RioViewModel
    
    public init(viewmodel: RioViewModel) {
        self.viewmodel = viewmodel
        Task {
            await viewmodel.loadRio()
        }
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 25) {

            Text(viewmodel.rio?.name ?? "Limay")
                .font(.title)
                .fontWeight(.bold)
                .padding(.horizontal)
            
            ForEach(viewmodel.rio?.sections ?? []) { section in
                LevelsView(levels: section.levels)
                    .frame(height: 200)
            }
        }
        .edgesIgnoringSafeArea(.top)
    }
}



// Preview provider for SwiftUI canvas
public struct RioView_Previews: PreviewProvider {
    public static var previews: some View {
        // Sample data for preview
        let rio = Rio.loadSample()
        let vm = RioViewModel(rio: rio)
        RioCardView(viewmodel: vm)
    }
}
