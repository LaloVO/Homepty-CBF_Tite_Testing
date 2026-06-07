"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import type { User } from "@/lib/supabase";

interface HeaderProps {
  user?: Pick<User, "nombre_usuario"> | null;
}

export default function Header({ user }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? "bg-background/95 backdrop-blur-md shadow-md"
        : "bg-transparent"
        }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full px-6 md:px-10 lg:px-16 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-foreground">
          Homepty
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/demos" className="text-muted-foreground hover:text-foreground transition-colors">
            Plantillas
          </Link>
          <a href="https://homepty.com/whyus" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            Nosotros
          </a>
          <a href="#footer" className="text-muted-foreground hover:text-foreground transition-colors">
            Contacto
          </a>
          <Button asChild>
            <Link href="/#pricing">{user ? "Completar Setup" : "Adquirir Plan"}</Link>
          </Button>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6 text-foreground" />
          ) : (
            <Menu className="w-6 h-6 text-foreground" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <motion.div
          className="md:hidden bg-background border-t border-border"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <nav className="flex flex-col p-6 gap-4">
            <Link
              href="/demos"
              className="text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Plantillas
            </Link>
            <a
              href="https://homepty.com/whyus"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Nosotros
            </a>
            <a
              href="#footer"
              className="text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contacto
            </a>
            <Button className="w-full mt-2" asChild>
              <Link href="/#pricing" onClick={() => setIsMobileMenuOpen(false)}>{user ? "Completar Setup" : "Adquirir Plan"}</Link>
            </Button>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
}
