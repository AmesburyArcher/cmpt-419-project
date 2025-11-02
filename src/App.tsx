import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NFLAnalyzer } from "./components/NFLAnalyzer";
import { MainLayout } from "@/layouts/MainLayout";

// Create a query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout
        header={
          <header className="bg-white">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    NFL Market Analyzer
                  </h1>
                  <p className="text-sm text-gray-600">
                    Train a model on historical data, then compare predictions
                    to live odds
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    Data-Centric AI Project
                  </p>
                </div>
              </div>
            </div>
          </header>
        }
        body={
          <main>
            <NFLAnalyzer />
          </main>
        }
        footer={
          <footer className="bg-white">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Disclaimer
                  </h3>
                  <p className="text-xs">
                    This tool is for educational and research purposes only.
                    Sports betting involves risk. Past performance does not
                    guarantee future results. Always gamble responsibly.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    How It Works
                  </h3>
                  <p className="text-xs">
                    Upload historical NFL data → Train logistic regression model
                    → Compare model predictions to live market odds → Identify
                    potential +EV opportunities.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Methodology
                  </h3>
                  <p className="text-xs">
                    Uses client-side TensorFlow.js for predictions. Features
                    calibration analysis, Brier scoring, and Quarter Kelly
                    Criterion for bankroll management.
                  </p>
                </div>
              </div>
            </div>
          </footer>
        }
      />
    </QueryClientProvider>
  );
}

export default App;
