import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, Globe, MapPin, Rocket, Shield, Heart } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function AboutPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
      {/* Header / Navigation */}
      <header className="h-16 flex items-center px-4 md:px-8 border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="mr-4 hover:bg-muted/50">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-display font-bold truncate">À propos de Nova</h1>
      </header>

      <main className="max-w-4xl mx-auto p-6 md:p-12 space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-gradient-to-tr from-primary to-accent mx-auto flex items-center justify-center shadow-2xl shadow-primary/30 relative"
          >
            <Sparkles className="w-12 h-12 md:w-16 md:h-16 text-white" />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-background rounded-full animate-pulse" />
          </motion.div>
          
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight">
              Bonjour, je suis <span className="text-primary">Nova</span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
              Une intelligence artificielle conçue pour t’assister, créer, analyser et imaginer.
            </p>
          </div>
        </section>

        {/* Creator Section */}
        <section className="bg-secondary/30 rounded-3xl p-8 md:p-12 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                L'architecte
              </div>
              <h3 className="text-3xl font-display font-bold">Ingénieur Kiriza Mushaga</h3>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Né à Bumba dans la province de la Mongala, en République Démocratique du Congo 🇨🇩. 
                </p>
                <p>
                  Visionnaire technologique, co-fondateur d'<strong>Okim Univers Global</strong> et créateur de <strong>Smartix</strong>.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2 text-sm font-medium bg-background/50 px-4 py-2 rounded-full border border-border">
                  <MapPin className="w-4 h-4 text-primary" />
                  RDC, Mongala
                </div>
                <div className="flex items-center gap-2 text-sm font-medium bg-background/50 px-4 py-2 rounded-full border border-border">
                  <Globe className="w-4 h-4 text-primary" />
                  Panafricanisme numérique
                </div>
              </div>
            </div>
            <div className="relative group">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-muted to-muted/30 overflow-hidden border border-white/5 flex items-center justify-center">
                {/* Placeholder for Creator Image */}
                <UserIcon className="w-24 h-24 text-muted-foreground/30 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground p-6 rounded-2xl shadow-xl rotate-3">
                <h4 className="font-bold">Visionary Creator</h4>
              </div>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { 
              icon: Rocket, 
              title: "Innovation Africaine", 
              desc: "Prouver que l'excellence technologique n'a pas de frontières.",
              color: "text-blue-400"
            },
            { 
              icon: Heart, 
              title: "Utile & Accessible", 
              desc: "Démocratiser l'IA pour chaque étudiant, créateur et entrepreneur.",
              color: "text-red-400"
            },
            { 
              icon: Shield, 
              title: "Éthique & Sécurité", 
              desc: "Construire un futur numérique basé sur la confiance et le respect.",
              color: "text-green-400"
            }
          ].map((item, i) => (
            <div key={i} className="p-8 rounded-3xl bg-card border border-border/50 hover:bg-secondary/30 transition-all duration-300 group">
              <item.icon className={cn("w-10 h-10 mb-6 transition-transform group-hover:scale-110", item.color)} />
              <h4 className="text-xl font-bold mb-3">{item.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </section>

        {/* Footer */}
        <footer className="text-center py-12 border-t border-border/50">
          <p className="text-sm text-muted-foreground font-medium">
            Nova est une création de <span className="text-foreground font-bold">Smartix & Okim Univers Global</span>
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-2 uppercase tracking-widest">
            Propulsé par l'intelligence, guidé par l'humain.
          </p>
        </footer>
      </main>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
