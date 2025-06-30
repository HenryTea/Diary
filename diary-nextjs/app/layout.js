import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../src/contexts/ThemeContext";
import { AuthProvider } from "../src/contexts/AuthContext";
import RouterErrorBoundary from "../src/components/RouterErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Diary App",
  description: "A rich text diary application",
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport = {
  themeColor: "#e9f3f6"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ backgroundColor: 'var(--bg-primary)', margin: 0, padding: 0 }}
      >
        <AuthProvider>
          <ThemeProvider>
            <RouterErrorBoundary>
              {children}
            </RouterErrorBoundary>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
