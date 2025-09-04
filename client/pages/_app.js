import "@/styles/globals.css";
import { AppContextProvider } from "@/context/AppContext";

export default function App({ Component, pageProps }) {
  return (
    <AppContextProvider
      initialUserData={pageProps.initialUserData}
      initialCartData={pageProps.initialCartData}
      initialCashbackData={pageProps.initialCashbackData}
      initialRecentAddress={pageProps.initialRecentAddress}
    >
      <Component {...pageProps} />
    </AppContextProvider>
  );
}
