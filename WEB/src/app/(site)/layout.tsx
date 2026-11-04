import SmoothScroll from "@/components/SmoothScroll";
import Preloader from "@/components/Preloader";
import Cursor from "@/components/Cursor";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ContentProvider from "@/components/ContentProvider";
import { AlertBar, DealToast } from "@/components/SiteChrome";
import { getContent } from "@/lib/content";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ContentProvider content={await getContent()}>
      <Preloader />
      <AlertBar />
      <SmoothScroll />
      <Cursor />
      <Nav />
      {children}
      <Footer />
      <DealToast />
      <div className="grain" aria-hidden />
    </ContentProvider>
  );
}
