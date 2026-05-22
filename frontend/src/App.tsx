import { GoogleOAuthProvider } from "@react-oauth/google";
import AppRouter from "./router/AppRouter";
export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AppRouter />
    </GoogleOAuthProvider>
  );
}
